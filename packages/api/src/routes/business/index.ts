import { Hono } from 'hono';
import { db } from '@repo/database';
import { z } from 'zod';
import { BusinessStatus, EventStatus } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import type { Session } from '@repo/auth';
import aiSearchApp from './ai-search';
import { analyticsApp } from './analytics';

type Variables = {
  session: Session["session"];
  user: Session["user"];
};

const businessApp = new Hono<{ Variables: Variables }>();

// Mount AI search routes
businessApp.route('/ai-search', aiSearchApp);

// Mount analytics routes (note: analytics handles its own auth)
businessApp.route('/', analyticsApp);

// Validation schemas
const createBusinessSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(160).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  categoryIds: z.array(z.string()).min(1),
  location: z.object({
    streetAddress: z.string(),
    streetAddress2: z.string().optional(),
    city: z.string(),
    state: z.string().default('MN'),
    zipCode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
});

const updateBusinessSchema = createBusinessSchema.partial();

const searchBusinessSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().optional(),
  city: z.string().optional(),
  status: z.nativeEnum(BusinessStatus).optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().min(1).max(100).optional(), // miles
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'distance', 'rating']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Generate slug from business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Public endpoints
businessApp.get('/search', async (c) => {
  const query = searchBusinessSchema.parse(c.req.query());
  const { page, limit, sortBy, sortOrder, lat, lng, radius, ...filters } = query;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    status: filters.status || BusinessStatus.ACTIVE,
  };

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  if (filters.categoryId) {
    where.categories = {
      some: { categoryId: filters.categoryId },
    };
  }

  if (filters.city) {
    where.locations = {
      some: { city: { contains: filters.city, mode: 'insensitive' } },
    };
  }

  if (filters.featured !== undefined) {
    where.featured = filters.featured;
  }

  if (filters.verified !== undefined) {
    where.verified = filters.verified;
  }

  // Get businesses with locations
  const businesses = await db.business.findMany({
    where,
    skip,
    take: limit,
    include: {
      locations: true,
      categories: {
        include: { category: true },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: sortBy === 'name' ? { name: sortOrder } : { createdAt: sortOrder },
  });

  // Filter by distance if location provided
  let filteredBusinesses = businesses;
  if (lat && lng && radius) {
    filteredBusinesses = businesses.filter(business => {
      const primaryLocation = business.locations.find(l => l.isPrimary) || business.locations[0];
      if (!primaryLocation) return false;
      
      const distance = calculateDistance(lat, lng, primaryLocation.latitude, primaryLocation.longitude);
      return distance <= radius;
    });
  }

  // Calculate average ratings
  const businessesWithRatings = filteredBusinesses.map(business => {
    const ratings = business.reviews.map(r => r.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : null;
    
    return {
      ...business,
      averageRating,
      reviewCount: ratings.length,
    };
  });

  const total = await db.business.count({ where });

  return c.json({
    data: businessesWithRatings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

businessApp.get('/:slug', async (c) => {
  const { slug } = c.req.param();
  
  const business = await db.business.findUnique({
    where: { slug },
    include: {
      locations: {
        include: { hours: true },
      },
      categories: {
        include: { category: true },
      },
      reviews: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      amenities: true,
      socialLinks: true,
      events: {
        where: {
          status: EventStatus.PUBLISHED,
          startDate: { gte: new Date() },
        },
        orderBy: { startDate: 'asc' },
        take: 5,
      },
    },
  });

  if (!business) {
    return c.json({ error: 'Business not found' }, 404);
  }

  // Calculate average rating
  const ratings = business.reviews.map(r => r.rating);
  const averageRating = ratings.length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
    : null;

  // Track view
  await db.businessAnalytics.upsert({
    where: {
      businessId_date: {
        businessId: business.id,
        date: new Date(new Date().toDateString()),
      },
    },
    update: {
      detailViews: { increment: 1 },
    },
    create: {
      businessId: business.id,
      date: new Date(new Date().toDateString()),
      detailViews: 1,
    },
  });

  return c.json({
    ...business,
    averageRating,
    reviewCount: ratings.length,
  });
});

// Protected endpoints
businessApp.use('/*', authMiddleware);

businessApp.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = createBusinessSchema.parse(body);
  
  const slug = generateSlug(data.name);
  
  // Check if slug already exists
  const existing = await db.business.findUnique({ where: { slug } });
  if (existing) {
    return c.json({ error: 'Business name already exists' }, 400);
  }

  const business = await db.business.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      shortDescription: data.shortDescription,
      website: data.website,
      email: data.email,
      phone: data.phone,
      yearEstablished: data.yearEstablished,
      status: BusinessStatus.PENDING,
      claimedById: user.id,
      locations: {
        create: {
          ...data.location,
          isPrimary: true,
        },
      },
      categories: {
        create: data.categoryIds.map((categoryId, index) => ({
          categoryId,
          isPrimary: index === 0,
        })),
      },
    },
    include: {
      locations: true,
      categories: {
        include: { category: true },
      },
    },
  });

  return c.json(business, 201);
});

businessApp.put('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = updateBusinessSchema.parse(body);

  // Check ownership
  const business = await db.business.findUnique({
    where: { id },
    select: { claimedById: true },
  });

  if (!business) {
    return c.json({ error: 'Business not found' }, 404);
  }

  if (business.claimedById !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Update business
  const updated = await db.business.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      shortDescription: data.shortDescription,
      website: data.website,
      email: data.email,
      phone: data.phone,
      yearEstablished: data.yearEstablished,
    },
    include: {
      locations: true,
      categories: {
        include: { category: true },
      },
    },
  });

  return c.json(updated);
});

businessApp.delete('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  // Check ownership
  const business = await db.business.findUnique({
    where: { id },
    select: { claimedById: true },
  });

  if (!business) {
    return c.json({ error: 'Business not found' }, 404);
  }

  if (business.claimedById !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  await db.business.delete({ where: { id } });

  return c.json({ success: true });
});

// Claim business endpoint
businessApp.post('/:id/claim', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  
  const business = await db.business.findUnique({
    where: { id },
    select: { claimedById: true },
  });

  if (!business) {
    return c.json({ error: 'Business not found' }, 404);
  }

  if (business.claimedById) {
    return c.json({ error: 'Business already claimed' }, 400);
  }

  // Create claim request
  const claim = await db.businessClaim.create({
    data: {
      businessId: id,
      userId: user.id,
      verificationType: body.verificationType,
      verificationData: body.verificationData,
      documents: body.documents || [],
    },
  });

  return c.json(claim, 201);
});

export { businessApp };