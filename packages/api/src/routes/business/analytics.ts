import { Hono } from 'hono';
import { db } from '@repo/database';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth';
import type { Session } from '@repo/auth';
import { subDays, subMonths, subYears, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';

type Variables = {
  session: Session["session"];
  user: Session["user"];
};

const analyticsApp = new Hono<{ Variables: Variables }>();

// Apply auth middleware
analyticsApp.use('/*', authMiddleware);

// Get analytics for a business
analyticsApp.get('/:id/analytics', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { timeRange = '30d' } = c.req.query();

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

  // Calculate date range
  let startDate: Date;
  const endDate = new Date();
  
  switch (timeRange) {
    case '7d':
      startDate = subDays(endDate, 7);
      break;
    case '30d':
      startDate = subDays(endDate, 30);
      break;
    case '90d':
      startDate = subDays(endDate, 90);
      break;
    case '1y':
      startDate = subYears(endDate, 1);
      break;
    default:
      startDate = subDays(endDate, 30);
  }

  // Fetch analytics data
  const [analytics, reviews, events] = await Promise.all([
    // Business analytics
    db.businessAnalytics.findMany({
      where: {
        businessId: id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    }),
    // Reviews
    db.review.findMany({
      where: {
        businessId: id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        rating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    // Events
    db.event.findMany({
      where: {
        businessId: id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
  ]);

  // Calculate overview stats
  const totalViews = analytics.reduce((sum, a) => sum + a.detailViews, 0);
  const previousPeriodStart = subDays(startDate, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const previousPeriodAnalytics = await db.businessAnalytics.findMany({
    where: {
      businessId: id,
      date: {
        gte: previousPeriodStart,
        lt: startDate,
      },
    },
  });
  
  const previousTotalViews = previousPeriodAnalytics.reduce((sum, a) => sum + a.detailViews, 0);
  const viewsChange = previousTotalViews > 0 
    ? ((totalViews - previousTotalViews) / previousTotalViews) * 100 
    : 0;

  // Calculate average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  // Prepare views over time data
  const viewsOverTime = analytics.map(a => ({
    date: format(a.date, 'yyyy-MM-dd'),
    views: a.detailViews,
  }));

  // Prepare reviews over time data
  const reviewsByDate = reviews.reduce((acc, review) => {
    const date = format(review.createdAt, 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { count: 0, totalRating: 0 };
    }
    acc[date].count++;
    acc[date].totalRating += review.rating;
    return acc;
  }, {} as Record<string, { count: number; totalRating: number }>);

  const reviewsOverTime = Object.entries(reviewsByDate).map(([date, data]) => ({
    date,
    count: data.count,
    averageRating: data.totalRating / data.count,
  }));

  // Mock traffic sources (in a real app, you'd track this)
  const trafficSources = [
    { source: 'Direct', count: Math.floor(totalViews * 0.4), percentage: 40 },
    { source: 'Search', count: Math.floor(totalViews * 0.3), percentage: 30 },
    { source: 'Social', count: Math.floor(totalViews * 0.2), percentage: 20 },
    { source: 'Referral', count: Math.floor(totalViews * 0.1), percentage: 10 },
  ];

  // Mock popular times (in a real app, you'd track this)
  const popularTimes = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    views: Math.floor(Math.random() * 100) + 10,
  }));

  // Event performance
  const eventPerformance = events.map(event => {
    const eventAnalytics = analytics.find(a => 
      a.date.toDateString() === event.createdAt.toDateString()
    );
    
    return {
      name: event.title,
      registrations: 0, // TODO: Add event registration tracking
      views: eventAnalytics?.detailViews || 0,
      conversionRate: 0, // TODO: Calculate when registrations are tracked
    };
  });

  return c.json({
    overview: {
      totalViews,
      viewsChange: Math.round(viewsChange),
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      totalEvents: events.length,
      upcomingEvents: events.filter(e => new Date(e.startDate) > new Date()).length,
    },
    viewsOverTime,
    reviewsOverTime,
    trafficSources,
    popularTimes,
    eventPerformance,
  });
});

// Record a view (public endpoint)
analyticsApp.post('/:id/view', async (c) => {
  const { id } = c.req.param();
  const { source = 'direct' } = await c.req.json();

  try {
    await db.businessAnalytics.upsert({
      where: {
        businessId_date: {
          businessId: id,
          date: startOfDay(new Date()),
        },
      },
      update: {
        detailViews: { increment: 1 },
      },
      create: {
        businessId: id,
        date: startOfDay(new Date()),
        detailViews: 1,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to record view' }, 500);
  }
});

export { analyticsApp };