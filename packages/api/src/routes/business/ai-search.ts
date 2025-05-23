import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../../middleware/auth';
import { type Session } from '@repo/auth';
import { db } from '@repo/database';
import { openaiClient as openai } from '@repo/ai';

const aiSearchSchema = z.object({
  query: z.string().min(1).max(500),
  includeRecommendations: z.boolean().optional().default(true),
  limit: z.number().min(1).max(50).optional().default(10),
  userContext: z.object({
    industry: z.string().optional(),
    businessSize: z.string().optional(),
    location: z.string().optional(),
    needs: z.array(z.string()).optional(),
  }).optional(),
});

type AiSearchContext = {
  Variables: {
    session: Session["session"];
    user: Session["user"];
  };
} & {
  Variables: {};
};

const app = new Hono<AiSearchContext>();

// AI-powered business search
app.post(
  '/',
  zValidator('json', aiSearchSchema),
  async (c) => {
    const { query, includeRecommendations, limit, userContext } = c.req.valid('json');

    try {
      // Generate embeddings for the search query
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      const queryEmbedding = embedding.data[0].embedding;

      // Enhance query with AI understanding
      const enhancedQuery = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that enhances search queries for an AI-focused business directory in Minnesota. 
            Extract key intents, services, and business types from the user's query.
            Output a JSON object with: keywords (array), businessTypes (array), services (array), and intent (string).`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const searchEnhancements = JSON.parse(enhancedQuery.choices[0].message.content || '{}');

      // Search businesses using enhanced query
      const businesses = await db.business.findMany({
        where: {
          AND: [
            { status: 'ACTIVE' },
            {
              OR: [
                // Text search on name and description
                {
                  OR: searchEnhancements.keywords?.map((keyword: string) => ({
                    OR: [
                      { name: { contains: keyword, mode: 'insensitive' } },
                      { description: { contains: keyword, mode: 'insensitive' } },
                      { shortDescription: { contains: keyword, mode: 'insensitive' } },
                    ],
                  })) || [],
                },
                // Category matching
                {
                  categories: {
                    some: {
                      category: {
                        name: {
                          in: searchEnhancements.businessTypes || [],
                          mode: 'insensitive',
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        include: {
          locations: true,
          categories: {
            include: {
              category: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        take: limit * 2, // Get more for AI filtering
      });

      // Calculate relevance scores
      const scoredBusinesses = businesses.map((business) => {
        let score = 0;

        // Name match
        if (business.name.toLowerCase().includes(query.toLowerCase())) {
          score += 10;
        }

        // Description match
        const desc = (business.description || '') + ' ' + (business.shortDescription || '');
        searchEnhancements.keywords?.forEach((keyword: string) => {
          if (desc.toLowerCase().includes(keyword.toLowerCase())) {
            score += 5;
          }
        });

        // Category match
        business.categories.forEach((cat) => {
          if (searchEnhancements.businessTypes?.includes(cat.category.name)) {
            score += 8;
          }
        });

        // Rating boost
        const avgRating = business.reviews.length > 0
          ? business.reviews.reduce((sum, r) => sum + r.rating, 0) / business.reviews.length
          : 0;
        score += avgRating * 2;

        // Verified boost
        if (business.verified) score += 5;
        
        // Featured boost
        if (business.featured) score += 3;

        return {
          ...business,
          averageRating: avgRating,
          reviewCount: business.reviews.length,
          relevanceScore: score,
        };
      });

      // Sort by relevance
      scoredBusinesses.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Get top results
      const topResults = scoredBusinesses.slice(0, limit);

      // Generate AI recommendations if requested
      let recommendations = null;
      if (includeRecommendations && topResults.length > 0) {
        const recommendationPrompt = `
          Based on the user's search "${query}" and context:
          ${userContext ? JSON.stringify(userContext) : 'No specific context provided'}
          
          And these search results:
          ${topResults.slice(0, 5).map(b => `- ${b.name}: ${b.shortDescription || b.description}`).join('\n')}
          
          Provide 3 specific recommendations for how these businesses could help the user.
          Be specific and actionable. Format as a JSON array of strings.
        `;

        const aiRecommendations = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: 'You are a helpful Minnesota business directory assistant.' },
            { role: 'user', content: recommendationPrompt },
          ],
          response_format: { type: 'json_object' },
        });

        recommendations = JSON.parse(aiRecommendations.choices[0].message.content || '{"recommendations": []}').recommendations;
      }

      // Format results
      const results = topResults.map(({ relevanceScore, reviews, ...business }) => ({
        ...business,
        averageRating: business.averageRating,
        reviewCount: business.reviewCount,
      }));

      return c.json({
        success: true,
        data: {
          results,
          searchEnhancements,
          recommendations,
          totalResults: results.length,
        },
      });
    } catch (error) {
      console.error('AI search error:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to perform AI search',
        },
        500
      );
    }
  }
);

// Get AI-powered recommendations
app.post(
  '/recommendations',
  zValidator('json', z.object({
    businessId: z.string().optional(),
    userContext: z.object({
      industry: z.string().optional(),
      businessSize: z.string().optional(),
      location: z.string().optional(),
      needs: z.array(z.string()).optional(),
      previousInteractions: z.array(z.string()).optional(),
    }),
    limit: z.number().min(1).max(20).optional().default(5),
  })),
  async (c) => {
    const { businessId, userContext, limit } = c.req.valid('json');

    try {
      // Build recommendation query
      let businesses;
      
      if (businessId) {
        // Find similar businesses
        const targetBusiness = await db.business.findUnique({
          where: { id: businessId },
          include: {
            categories: {
              include: { category: true },
            },
          },
        });

        if (!targetBusiness) {
          return c.json({ success: false, error: 'Business not found' }, 404);
        }

        const categoryIds = targetBusiness.categories.map(c => c.categoryId);

        businesses = await db.business.findMany({
          where: {
            AND: [
              { status: 'ACTIVE' },
              { id: { not: businessId } },
              {
                categories: {
                  some: {
                    categoryId: { in: categoryIds },
                  },
                },
              },
            ],
          },
          include: {
            locations: true,
            categories: {
              include: { category: true },
            },
            reviews: true,
          },
          take: limit * 3,
        });
      } else {
        // General recommendations based on context
        businesses = await db.business.findMany({
          where: {
            status: 'ACTIVE',
            featured: true,
          },
          include: {
            locations: true,
            categories: {
              include: { category: true },
            },
            reviews: true,
          },
          take: limit * 2,
        });
      }

      // Score and rank recommendations
      const scoredBusinesses = businesses.map((business) => {
        let score = 0;

        // Rating score
        const avgRating = business.reviews.length > 0
          ? business.reviews.reduce((sum, r) => sum + r.rating, 0) / business.reviews.length
          : 0;
        score += avgRating * 10;

        // Verified bonus
        if (business.verified) score += 20;

        // Featured bonus
        if (business.featured) score += 15;

        // Review count bonus (popularity)
        score += Math.min(business.reviews.length * 2, 20);

        // Location match (if user context includes location)
        if (userContext.location && business.locations.length > 0) {
          const hasLocationMatch = business.locations.some(
            loc => loc.city.toLowerCase().includes(userContext.location!.toLowerCase())
          );
          if (hasLocationMatch) score += 25;
        }

        return {
          ...business,
          averageRating: avgRating,
          reviewCount: business.reviews.length,
          recommendationScore: score,
        };
      });

      // Sort by recommendation score
      scoredBusinesses.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // Get top recommendations
      const recommendations = scoredBusinesses.slice(0, limit).map(({ recommendationScore, reviews, ...business }) => ({
        ...business,
        reason: generateRecommendationReason(business, userContext),
      }));

      return c.json({
        success: true,
        data: {
          recommendations,
          context: userContext,
        },
      });
    } catch (error) {
      console.error('Recommendation error:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to generate recommendations',
        },
        500
      );
    }
  }
);

// Helper function to generate recommendation reasons
function generateRecommendationReason(
  business: any,
  userContext: any
): string {
  const reasons = [];

  if (business.averageRating >= 4.5) {
    reasons.push(`Highly rated (${business.averageRating.toFixed(1)} stars)`);
  }

  if (business.verified) {
    reasons.push('Verified business');
  }

  if (business.featured) {
    reasons.push('Featured partner');
  }

  if (userContext.location && business.locations.length > 0) {
    const location = business.locations[0];
    if (location.city.toLowerCase().includes(userContext.location.toLowerCase())) {
      reasons.push(`Located in ${location.city}`);
    }
  }

  if (business.categories.length > 0) {
    const primaryCategory = business.categories.find((c: any) => c.isPrimary) || business.categories[0];
    reasons.push(`Specializes in ${primaryCategory.category.name}`);
  }

  return reasons.join(' • ') || 'Recommended for you';
}

export default app;