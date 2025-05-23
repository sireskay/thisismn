import { Hono } from 'hono';
import { db } from '@repo/database';
import { z } from 'zod';
import { BusinessStatus, EventStatus } from '@prisma/client';
import { bearerAuth } from 'hono/bearer-auth';
import { createHash } from 'crypto';

const publicApiApp = new Hono();

// API Key validation middleware
const apiKeyAuth = async (c: any, next: any) => {
  const apiKey = c.req.header('X-API-Key');
  
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401);
  }

  // Hash the API key to compare with stored hash
  const hashedKey = createHash('sha256').update(apiKey).digest('hex');
  
  // In a real app, you'd check this against a database
  // For now, we'll check against environment variable
  if (hashedKey !== process.env.PUBLIC_API_KEY_HASH) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  await next();
};

// Apply API key auth to all routes
publicApiApp.use('/*', apiKeyAuth);

// Validation schemas
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
});

const businessSearchSchema = paginationSchema.extend({
  query: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  verified: z.string().transform(val => val === 'true').optional(),
  featured: z.string().transform(val => val === 'true').optional(),
});

// API Documentation endpoint
publicApiApp.get('/', (c) => {
  return c.json({
    name: 'Minnesota Business Directory API',
    version: '1.0.0',
    description: 'Public API for accessing Minnesota business directory data',
    endpoints: {
      businesses: {
        search: 'GET /api/v1/businesses',
        get: 'GET /api/v1/businesses/:id',
        categories: 'GET /api/v1/businesses/categories',
      },
      events: {
        search: 'GET /api/v1/events',
        get: 'GET /api/v1/events/:id',
      },
      reviews: {
        business: 'GET /api/v1/reviews/business/:businessId',
        stats: 'GET /api/v1/reviews/business/:businessId/stats',
      },
    },
    authentication: 'Include X-API-Key header with your API key',
    rateLimit: '1000 requests per hour',
    contact: 'api@thisismn.com',
  });
});

// Business endpoints
publicApiApp.get('/businesses', async (c) => {
  const query = businessSearchSchema.parse(c.req.query());
  const { page, limit, ...filters } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    status: BusinessStatus.ACTIVE,
  };

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  if (filters.category) {
    where.categories = {
      some: {
        category: { name: { contains: filters.category, mode: 'insensitive' } },
      },
    };
  }

  if (filters.city) {
    where.locations = {
      some: { city: { contains: filters.city, mode: 'insensitive' } },
    };
  }

  if (filters.verified !== undefined) {
    where.verified = filters.verified;
  }

  if (filters.featured !== undefined) {
    where.featured = filters.featured;
  }

  const [businesses, total] = await Promise.all([
    db.business.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        website: true,
        email: true,
        phone: true,
        yearEstablished: true,
        verified: true,
        featured: true,
        locations: {
          select: {
            streetAddress: true,
            city: true,
            state: true,
            zipCode: true,
            latitude: true,
            longitude: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            isPrimary: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    }),
    db.business.count({ where }),
  ]);

  // Calculate average ratings
  const businessesWithRatings = await Promise.all(
    businesses.map(async (business) => {
      const avgRating = await db.review.aggregate({
        where: { businessId: business.id },
        _avg: { rating: true },
      });

      return {
        ...business,
        averageRating: avgRating._avg.rating || null,
        reviewCount: business._count.reviews,
        _count: undefined,
      };
    })
  );

  return c.json({
    success: true,
    data: businessesWithRatings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get single business
publicApiApp.get('/businesses/:id', async (c) => {
  const { id } = c.req.param();
  
  const business = await db.business.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      status: BusinessStatus.ACTIVE,
    },
    include: {
      locations: {
        include: { hours: true },
      },
      categories: {
        include: { category: true },
      },
      amenities: true,
      socialLinks: true,
      _count: {
        select: {
          reviews: true,
          events: true,
        },
      },
    },
  });

  if (!business) {
    return c.json({ error: 'Business not found' }, 404);
  }

  // Get average rating
  const avgRating = await db.review.aggregate({
    where: { businessId: business.id },
    _avg: { rating: true },
  });

  return c.json({
    success: true,
    data: {
      ...business,
      averageRating: avgRating._avg.rating || null,
      reviewCount: business._count.reviews,
      eventCount: business._count.events,
      _count: undefined,
    },
  });
});

// Get business categories
publicApiApp.get('/businesses/categories', async (c) => {
  const categories = await db.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          businesses: {
            where: {
              business: {
                status: BusinessStatus.ACTIVE,
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return c.json({
    success: true,
    data: categories.map(cat => ({
      ...cat,
      businessCount: cat._count.businesses,
      _count: undefined,
    })),
  });
});

// Event endpoints
publicApiApp.get('/events', async (c) => {
  const query = paginationSchema.parse(c.req.query());
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    db.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        startDate: { gte: new Date() },
      },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        type: true,
        startDate: true,
        endDate: true,
        virtualUrl: true,
        maxAttendees: true,
        price: true,
        currency: true,
        registrationRequired: true,
        location: {
          select: {
            name: true,
            streetAddress: true,
            city: true,
            state: true,
            zipCode: true,
            latitude: true,
            longitude: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    }),
    db.event.count({
      where: {
        status: EventStatus.PUBLISHED,
        startDate: { gte: new Date() },
      },
    }),
  ]);

  return c.json({
    success: true,
    data: events.map(event => ({
      ...event,
      registrationCount: event._count.registrations,
      _count: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get single event
publicApiApp.get('/events/:id', async (c) => {
  const { id } = c.req.param();
  
  const event = await db.event.findUnique({
    where: { id },
    include: {
      location: true,
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  if (!event || event.status !== EventStatus.PUBLISHED) {
    return c.json({ error: 'Event not found' }, 404);
  }

  return c.json({
    success: true,
    data: {
      ...event,
      registrationCount: event._count.registrations,
      spotsAvailable: event.maxAttendees 
        ? Math.max(0, event.maxAttendees - event._count.registrations)
        : null,
      _count: undefined,
    },
  });
});

// Review endpoints
publicApiApp.get('/reviews/business/:businessId', async (c) => {
  const { businessId } = c.req.param();
  const query = paginationSchema.parse(c.req.query());
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where: {
        businessId,
        status: 'PUBLISHED',
      },
      skip,
      take: limit,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        recommendsBusiness: true,
        visitDate: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        response: {
          select: {
            comment: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.review.count({
      where: {
        businessId,
        status: 'PUBLISHED',
      },
    }),
  ]);

  return c.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get review statistics
publicApiApp.get('/reviews/business/:businessId/stats', async (c) => {
  const { businessId } = c.req.param();

  const [stats, distribution] = await Promise.all([
    db.review.aggregate({
      where: {
        businessId,
        status: 'PUBLISHED',
      },
      _avg: { rating: true },
      _count: true,
    }),
    db.review.groupBy({
      by: ['rating'],
      where: {
        businessId,
        status: 'PUBLISHED',
      },
      _count: true,
    }),
  ]);

  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  distribution.forEach(item => {
    ratingDistribution[item.rating as keyof typeof ratingDistribution] = item._count;
  });

  const recommendationCount = await db.review.count({
    where: {
      businessId,
      status: 'PUBLISHED',
      recommendsBusiness: true,
    },
  });

  return c.json({
    success: true,
    data: {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count,
      ratingDistribution,
      recommendationRate: stats._count > 0 
        ? Math.round((recommendationCount / stats._count) * 100)
        : 0,
    },
  });
});

// API usage tracking
publicApiApp.use('/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  const endpoint = c.req.path;
  const method = c.req.method;
  
  // Track API usage (in a real app, store this in database)
  console.log(`API Usage: ${method} ${endpoint} - Key: ${apiKey?.substring(0, 8)}...`);
  
  await next();
});

export { publicApiApp };