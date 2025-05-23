import { Hono } from 'hono';
import { db } from '@repo/database';
import { z } from 'zod';
import { adminMiddleware } from '../../middleware/admin';
import type { Session } from '@repo/auth';

type Variables = {
  session: Session["session"];
  user: Session["user"];
};

const claimsApp = new Hono<{ Variables: Variables }>();

// Apply admin middleware to all routes
claimsApp.use('/*', adminMiddleware);

// Get all claims
claimsApp.get('/', async (c) => {
  const claims = await db.businessClaim.findMany({
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' }, // PENDING first
      { submittedAt: 'desc' },
    ],
  });

  return c.json(claims);
});

// Get single claim
claimsApp.get('/:id', async (c) => {
  const { id } = c.req.param();
  
  const claim = await db.businessClaim.findUnique({
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!claim) {
    return c.json({ error: 'Claim not found' }, 404);
  }

  return c.json(claim);
});

// Approve claim
claimsApp.post('/:id/approve', async (c) => {
  const admin = c.get('user');
  const { id } = c.req.param();
  const { notes } = await c.req.json();

  // Start transaction
  const result = await db.$transaction(async (tx) => {
    // Get claim
    const claim = await tx.businessClaim.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!claim) {
      throw new Error('Claim not found');
    }

    if (claim.status !== 'PENDING') {
      throw new Error('Claim already processed');
    }

    // Update claim
    const updatedClaim = await tx.businessClaim.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        notes,
      },
    });

    // Update business ownership
    await tx.business.update({
      where: { id: claim.businessId },
      data: {
        claimedById: claim.userId,
        verified: true, // Auto-verify on claim approval
      },
    });

    // Send notification to user (in a real app)
    // await sendClaimApprovedEmail(claim.userId, claim.business.name);

    return updatedClaim;
  });

  return c.json(result);
});

// Reject claim
claimsApp.post('/:id/reject', async (c) => {
  const admin = c.get('user');
  const { id } = c.req.param();
  const { notes } = await c.req.json();

  const claim = await db.businessClaim.findUnique({
    where: { id },
  });

  if (!claim) {
    return c.json({ error: 'Claim not found' }, 404);
  }

  if (claim.status !== 'PENDING') {
    return c.json({ error: 'Claim already processed' }, 400);
  }

  const updatedClaim = await db.businessClaim.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      notes,
    },
  });

  // Send notification to user (in a real app)
  // await sendClaimRejectedEmail(claim.userId, notes);

  return c.json(updatedClaim);
});

// Get claim statistics
claimsApp.get('/stats', async (c) => {
  const [total, pending, approved, rejected] = await Promise.all([
    db.businessClaim.count(),
    db.businessClaim.count({ where: { status: 'PENDING' } }),
    db.businessClaim.count({ where: { status: 'APPROVED' } }),
    db.businessClaim.count({ where: { status: 'REJECTED' } }),
  ]);

  const recentClaims = await db.businessClaim.findMany({
    where: { status: 'PENDING' },
    include: {
      business: {
        select: { name: true },
      },
      user: {
        select: { name: true },
      },
    },
    orderBy: { submittedAt: 'desc' },
    take: 5,
  });

  return c.json({
    total,
    pending,
    approved,
    rejected,
    recentClaims,
  });
});

export { claimsApp };