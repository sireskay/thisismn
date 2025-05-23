import { createMiddleware } from 'hono/factory';
import type { Session } from '@repo/auth';

type Variables = {
  session: Session["session"];
  user: Session["user"];
};

export const adminMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user is admin
  // In a real app, you would check against a role or permission system
  // For now, we'll check if the user email ends with @admin.com or has a specific ID
  const isAdmin = user.email?.endsWith('@admin.com') || 
                  user.email === 'admin@thisismn.com' ||
                  user.id === process.env.ADMIN_USER_ID;

  if (!isAdmin) {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }

  await next();
});