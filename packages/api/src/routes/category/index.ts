import { Hono } from 'hono';
import { db } from '@repo/database';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth';
import type { Session } from '@repo/auth';

type Variables = {
  session: Session["session"];
  user: Session["user"];
};

const categoryApp = new Hono<{ Variables: Variables }>();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

// Public endpoints
categoryApp.get('/', async (c) => {
  const { parentId, featured } = c.req.query();
  
  const where: any = {};
  
  if (parentId === 'null') {
    where.parentId = null;
  } else if (parentId) {
    where.parentId = parentId;
  }
  
  if (featured === 'true') {
    where.featured = true;
  }

  const categories = await db.category.findMany({
    where,
    include: {
      children: {
        orderBy: { displayOrder: 'asc' },
      },
      _count: {
        select: {
          businesses: true,
        },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return c.json(categories);
});

categoryApp.get('/tree', async (c) => {
  // Get all categories and build tree structure
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: {
          businesses: true,
        },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  // Build tree structure
  const categoryMap = new Map();
  const tree: any[] = [];

  // First pass: create map
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree
  categories.forEach(category => {
    const node = categoryMap.get(category.id);
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      tree.push(node);
    }
  });

  return c.json(tree);
});

categoryApp.get('/:slug', async (c) => {
  const { slug } = c.req.param();
  
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        orderBy: { displayOrder: 'asc' },
      },
      _count: {
        select: {
          businesses: true,
        },
      },
    },
  });

  if (!category) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json(category);
});

// Protected endpoints (admin only)
categoryApp.use('/*', authMiddleware);

categoryApp.post('/', async (c) => {
  const user = c.get('user');
  
  // Check if user is admin
  if (user.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const body = await c.req.json();
  const data = createCategorySchema.parse(body);

  // Check if slug already exists
  const existing = await db.category.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return c.json({ error: 'Category slug already exists' }, 400);
  }

  const category = await db.category.create({
    data,
    include: {
      parent: true,
      children: true,
    },
  });

  return c.json(category, 201);
});

categoryApp.put('/:id', async (c) => {
  const user = c.get('user');
  
  // Check if user is admin
  if (user.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = updateCategorySchema.parse(body);

  // Check if category exists
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: 'Category not found' }, 404);
  }

  // Check slug uniqueness if changing
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await db.category.findUnique({ where: { slug: data.slug } });
    if (slugExists) {
      return c.json({ error: 'Category slug already exists' }, 400);
    }
  }

  const category = await db.category.update({
    where: { id },
    data,
    include: {
      parent: true,
      children: true,
    },
  });

  return c.json(category);
});

categoryApp.delete('/:id', async (c) => {
  const user = c.get('user');
  
  // Check if user is admin
  if (user.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const { id } = c.req.param();

  // Check if category has businesses
  const businessCount = await db.businessCategory.count({
    where: { categoryId: id },
  });

  if (businessCount > 0) {
    return c.json({ error: 'Cannot delete category with associated businesses' }, 400);
  }

  // Check if category has children
  const childCount = await db.category.count({
    where: { parentId: id },
  });

  if (childCount > 0) {
    return c.json({ error: 'Cannot delete category with subcategories' }, 400);
  }

  await db.category.delete({ where: { id } });

  return c.json({ success: true });
});

export { categoryApp };