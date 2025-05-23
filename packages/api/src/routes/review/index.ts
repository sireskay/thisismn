import { Hono } from 'hono';
import { db } from '@repo/database';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth';
import type { Session } from '@repo/auth';

type Variables = {
  session: Session["session"];
  user: Session["user"];
};

const reviewApp = new Hono<{ Variables: Variables }>();

// Validation schemas
const createReviewSchema = z.object({
  businessId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(255),
  comment: z.string().min(10).max(2000),
  visitDate: z.string().transform(str => new Date(str)).optional(),
  recommendsBusiness: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
});

const updateReviewSchema = createReviewSchema.partial().omit({ businessId: true });

const reviewResponseSchema = z.object({
  comment: z.string().min(10).max(1000),
});

// Public endpoints

// Get reviews for a business
reviewApp.get('/business/:businessId', async (c) => {
  const { businessId } = c.req.param();
  const { page = '1', limit = '10', sort = 'recent' } = c.req.query();
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const orderBy = sort === 'recent' 
    ? { createdAt: 'desc' as const }
    : sort === 'rating-high' 
    ? { rating: 'desc' as const }
    : sort === 'rating-low'
    ? { rating: 'asc' as const }
    : { helpful: 'desc' as const };

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where: { 
        businessId,
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        response: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy,
      skip,
      take: limitNum,
    }),
    db.review.count({
      where: { 
        businessId,
        status: 'PUBLISHED',
      },
    }),
  ]);

  // Get helpful vote counts
  const reviewsWithVotes = await Promise.all(
    reviews.map(async (review) => {
      const helpfulVotes = await db.reviewVote.count({
        where: {
          reviewId: review.id,
          isHelpful: true,
        },
      });

      return {
        ...review,
        helpfulVotes,
        totalVotes: review._count.votes,
      };
    })
  );

  return c.json({
    data: reviewsWithVotes,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// Get review statistics for a business
reviewApp.get('/business/:businessId/stats', async (c) => {
  const { businessId } = c.req.param();

  const reviews = await db.review.findMany({
    where: { 
      businessId,
      status: 'PUBLISHED',
    },
    select: {
      rating: true,
      recommendsBusiness: true,
    },
  });

  if (reviews.length === 0) {
    return c.json({
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
      recommendationRate: 0,
    });
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  const ratingDistribution = reviews.reduce((dist, review) => {
    dist[review.rating] = (dist[review.rating] || 0) + 1;
    return dist;
  }, {} as Record<number, number>);

  const recommendations = reviews.filter(r => r.recommendsBusiness === true).length;
  const recommendationRate = (recommendations / reviews.length) * 100;

  return c.json({
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
    ratingDistribution: {
      1: ratingDistribution[1] || 0,
      2: ratingDistribution[2] || 0,
      3: ratingDistribution[3] || 0,
      4: ratingDistribution[4] || 0,
      5: ratingDistribution[5] || 0,
    },
    recommendationRate: Math.round(recommendationRate),
  });
});

// Protected endpoints
reviewApp.use('/*', authMiddleware);

// Create a review
reviewApp.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = createReviewSchema.parse(body);

  // Check if user has already reviewed this business
  const existingReview = await db.review.findFirst({
    where: {
      businessId: data.businessId,
      userId: user.id,
    },
  });

  if (existingReview) {
    return c.json({ error: 'You have already reviewed this business' }, 400);
  }

  // Create review
  const review = await db.review.create({
    data: {
      ...data,
      userId: user.id,
      status: 'PUBLISHED', // Auto-publish for now
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Update business average rating
  await updateBusinessRating(data.businessId);

  return c.json(review, 201);
});

// Update a review
reviewApp.put('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = updateReviewSchema.parse(body);

  // Check ownership
  const review = await db.review.findUnique({
    where: { id },
    select: { userId: true, businessId: true },
  });

  if (!review) {
    return c.json({ error: 'Review not found' }, 404);
  }

  if (review.userId !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Update review
  const updated = await db.review.update({
    where: { id },
    data: {
      ...data,
      editedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Update business average rating if rating changed
  if (data.rating !== undefined) {
    await updateBusinessRating(review.businessId);
  }

  return c.json(updated);
});

// Delete a review
reviewApp.delete('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  // Check ownership
  const review = await db.review.findUnique({
    where: { id },
    select: { userId: true, businessId: true },
  });

  if (!review) {
    return c.json({ error: 'Review not found' }, 404);
  }

  if (review.userId !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  await db.review.delete({ where: { id } });

  // Update business average rating
  await updateBusinessRating(review.businessId);

  return c.json({ success: true });
});

// Vote on a review
reviewApp.post('/:id/vote', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { isHelpful } = await c.req.json();

  // Check if user has already voted
  const existingVote = await db.reviewVote.findUnique({
    where: {
      reviewId_userId: {
        reviewId: id,
        userId: user.id,
      },
    },
  });

  if (existingVote) {
    // Update existing vote
    const updated = await db.reviewVote.update({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId: user.id,
        },
      },
      data: { isHelpful },
    });
    return c.json(updated);
  }

  // Create new vote
  const vote = await db.reviewVote.create({
    data: {
      reviewId: id,
      userId: user.id,
      isHelpful,
    },
  });

  return c.json(vote, 201);
});

// Business owner response to review
reviewApp.post('/:id/response', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = reviewResponseSchema.parse(body);

  // Get review and check if user owns the business
  const review = await db.review.findUnique({
    where: { id },
    include: {
      business: {
        select: { claimedById: true },
      },
      response: true,
    },
  });

  if (!review) {
    return c.json({ error: 'Review not found' }, 404);
  }

  if (review.business.claimedById !== user.id) {
    return c.json({ error: 'Only business owners can respond to reviews' }, 403);
  }

  if (review.response) {
    return c.json({ error: 'Review already has a response' }, 400);
  }

  // Create response
  const response = await db.reviewResponse.create({
    data: {
      reviewId: id,
      userId: user.id,
      comment: data.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return c.json(response, 201);
});

// Report a review
reviewApp.post('/:id/report', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { reason, details } = await c.req.json();

  const review = await db.review.findUnique({
    where: { id },
  });

  if (!review) {
    return c.json({ error: 'Review not found' }, 404);
  }

  // In a real app, this would create a moderation ticket
  // For now, we'll just log it
  console.log(`Review ${id} reported by user ${user.id}: ${reason} - ${details}`);

  return c.json({ success: true });
});

// Helper function to update business average rating
async function updateBusinessRating(businessId: string) {
  const reviews = await db.review.findMany({
    where: { 
      businessId,
      status: 'PUBLISHED',
    },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  // Store in a denormalized field for performance
  // You might want to add this field to your Business model
  // await db.business.update({
  //   where: { id: businessId },
  //   data: { 
  //     averageRating: Math.round(averageRating * 10) / 10,
  //     reviewCount: reviews.length,
  //   },
  // });
}

export { reviewApp };