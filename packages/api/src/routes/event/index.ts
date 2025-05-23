import { Hono } from 'hono';
import { db } from '@repo/database';
import { z } from 'zod';
import { EventStatus } from '@repo/database';
import { authMiddleware } from '../../middleware/auth';
import type { Session } from '@repo/auth';

type Variables = {
  session: Session["session"];
  user: Session["user"];
};

const eventApp = new Hono<{ Variables: Variables }>();

// Validation schemas
const createEventSchema = z.object({
  businessId: z.string(),
  title: z.string().min(1).max(255),
  description: z.string(),
  shortDescription: z.string().max(160).optional(),
  isVirtual: z.boolean().optional().default(false),
  isHybrid: z.boolean().optional().default(false),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  venue: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().default('MN'),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  virtualUrl: z.string().url().optional(),
  maxAttendees: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  registrationRequired: z.boolean().default(false),
  registrationUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().url().optional(),
});

const updateEventSchema = createEventSchema.partial().extend({
  businessId: z.string().optional(),
});

const searchEventSchema = z.object({
  query: z.string().optional(),
  businessId: z.string().optional(),
  isVirtual: z.boolean().optional(),
  isHybrid: z.boolean().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().min(1).max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['startDate', 'createdAt', 'title']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Calculate distance between two points
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
eventApp.get('/search', async (c) => {
  const query = searchEventSchema.parse(c.req.query());
  const { page, limit, sortBy, sortOrder, lat, lng, radius, ...filters } = query;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    status: filters.status || EventStatus.PUBLISHED,
  };

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  if (filters.businessId) {
    where.businessId = filters.businessId;
  }

  if (filters.isVirtual !== undefined) {
    where.isVirtual = filters.isVirtual;
  }
  
  if (filters.isHybrid !== undefined) {
    where.isHybrid = filters.isHybrid;
  }

  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' };
  }

  // Date filters
  const dateFilters: any = {};
  if (filters.startDate) {
    dateFilters.startDate = { gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    dateFilters.endDate = { lte: new Date(filters.endDate) };
  }
  if (Object.keys(dateFilters).length > 0) {
    where.AND = dateFilters;
  }

  // Get events
  const events = await db.event.findMany({
    where,
    skip,
    take: limit,
    include: {
      business: {
        include: {
          locations: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { [sortBy]: sortOrder },
  });

  // Filter by distance if location provided
  let filteredEvents = events;
  if (lat && lng && radius) {
    filteredEvents = events.filter(event => {
      if (!event.latitude || !event.longitude) return false;
      const distance = calculateDistance(lat, lng, event.latitude, event.longitude);
      return distance <= radius;
    });
  }

  // Format events with registration count
  const formattedEvents = filteredEvents.map(event => ({
    ...event,
    registrationCount: 0, // TODO: Add registration tracking
  }));

  const total = await db.event.count({ where });

  return c.json({
    data: formattedEvents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

eventApp.get('/:id', async (c) => {
  const { id } = c.req.param();
  
  const event = await db.event.findUnique({
    where: { id },
    include: {
      business: {
        include: {
          locations: true,
          categories: {
            include: { category: true },
          },
        },
      },
    },
  });

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  // TODO: Add event analytics tracking

  return c.json({
    ...event,
    registrationCount: 0, // TODO: Add registration tracking
  });
});

// Protected endpoints
eventApp.use('/*', authMiddleware);

eventApp.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const data = createEventSchema.parse(body);

  // Check if user owns the business
  const business = await db.business.findUnique({
    where: { id: data.businessId },
    select: { claimedById: true },
  });

  if (!business) {
    return c.json({ error: 'Business not found' }, 404);
  }

  if (business.claimedById !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Create event
  const event = await db.event.create({
    data: {
      ...data,
      status: EventStatus.DRAFT,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    },
    include: {
      business: true,
    },
  });

  return c.json(event, 201);
});

eventApp.put('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = updateEventSchema.parse(body);

  // Check ownership
  const event = await db.event.findUnique({
    where: { id },
    include: {
      business: {
        select: { claimedById: true },
      },
    },
  });

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  if (!event.business || event.business.claimedById !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Update event
  const updated = await db.event.update({
    where: { id },
    data,
    include: {
      business: true,
    },
  });

  return c.json(updated);
});

eventApp.patch('/:id/status', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { status } = await c.req.json();

  if (!Object.values(EventStatus).includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  // Check ownership
  const event = await db.event.findUnique({
    where: { id },
    include: {
      business: {
        select: { claimedById: true },
      },
    },
  });

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  if (!event.business || event.business.claimedById !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Update status
  const updated = await db.event.update({
    where: { id },
    data: { status },
  });

  return c.json(updated);
});

eventApp.delete('/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  // Check ownership
  const event = await db.event.findUnique({
    where: { id },
    include: {
      business: {
        select: { claimedById: true },
      },
    },
  });

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  if (!event.business || event.business.claimedById !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  await db.event.delete({ where: { id } });

  return c.json({ success: true });
});

// TODO: Implement event registration when EventRegistration model is added
/*
// Register for event
eventApp.post('/:id/register', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();

  const event = await db.event.findUnique({
    where: { id },
    include: {
    },
  });

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  if (event.status !== EventStatus.PUBLISHED) {
    return c.json({ error: 'Event is not available for registration' }, 400);
  }

  if (event.registrations.length > 0) {
    return c.json({ error: 'Already registered for this event' }, 400);
  }

  if (event.maxAttendees) {
    const registrationCount = await db.eventRegistration.count({
      where: { eventId: id, status: 'CONFIRMED' },
    });

    if (registrationCount >= event.maxAttendees) {
      return c.json({ error: 'Event is full' }, 400);
    }
  }

  // Create registration
  const registration = await db.eventRegistration.create({
    data: {
      eventId: id,
      userId: user.id,
      attendeeName: body.attendeeName || user.name,
      attendeeEmail: body.attendeeEmail || user.email,
      attendeePhone: body.attendeePhone,
      additionalInfo: body.additionalInfo,
      status: 'CONFIRMED',
    },
  });

  // Track registration
  await db.eventAnalytics.upsert({
    where: {
      eventId_date: {
        eventId: id,
        date: new Date(new Date().toDateString()),
      },
    },
    update: {
      views: { increment: 1 }, // TODO: Track registrations separately
    },
    create: {
      eventId: id,
      date: new Date(new Date().toDateString()),
      views: 1, // TODO: Track registrations separately
    },
  });

  return c.json(registration, 201);
});

// Cancel registration
eventApp.delete('/:id/register', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();

  const registration = await db.eventRegistration.findFirst({
    where: {
      eventId: id,
      userId: user.id,
      status: 'CONFIRMED',
    },
  });

  if (!registration) {
    return c.json({ error: 'Registration not found' }, 404);
  }

  await db.eventRegistration.update({
    where: { id: registration.id },
    data: { status: 'CANCELLED' },
  });

  return c.json({ success: true });
});
*/

export { eventApp };