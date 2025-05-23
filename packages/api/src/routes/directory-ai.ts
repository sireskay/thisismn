import { openaiClient } from "@repo/ai";
import { db } from "@repo/database";
import { Hono } from "hono";
import { z } from "zod";

const directoryAiRouter = new Hono().basePath("/directory-ai");

const MessageSchema = z.object({
	role: z.enum(["user", "assistant"]),
	content: z.string(),
});

// Directory-specific chat endpoint - no auth required for public directory
directoryAiRouter.post("/chat", async (c) => {
	const body = await c.req.json();
	const { messages, context } = body;

	try {
		// Build system prompt based on context
		let systemPrompt = `You are an AI assistant for the Minnesota Business Directory, a platform focused on AI-powered businesses and services in Minnesota. 
		You help users find businesses, events, and information about the local AI ecosystem.
		Be helpful, concise, and friendly. When suggesting businesses or events, provide specific recommendations with relevant details.`;

		if (context?.businessId) {
			// Fetch business details for context
			const business = await db.business.findUnique({
				where: { id: context.businessId },
				include: {
					categories: { include: { category: true } },
					locations: true,
				},
			});

			if (business) {
				systemPrompt += `\n\nYou are specifically helping with questions about ${business.name}, a ${business.categories[0]?.category.name} business. 
				Here's what you know about them: ${business.description}`;
			}
		}

		// Get AI response
		const completion = await openaiClient.chat.completions.create({
			model: 'gpt-4-turbo-preview',
			messages: [
				{ role: 'system', content: systemPrompt },
				...messages,
			],
			temperature: 0.7,
			max_tokens: 500,
		});

		const responseContent = completion.choices[0].message.content || '';

		// Extract any business/event suggestions from the response
		let suggestions: any[] = [];

		// Simple keyword detection for suggestions
		if (responseContent.toLowerCase().includes('recommend') || 
				responseContent.toLowerCase().includes('suggest') ||
				responseContent.toLowerCase().includes('check out')) {
			
			// Search for relevant businesses
			const searchTerms = extractSearchTerms(responseContent);
			if (searchTerms.length > 0) {
				const businesses = await db.business.findMany({
					where: {
						AND: [
							{ status: 'ACTIVE' },
							{
								OR: searchTerms.map(term => ({
									OR: [
										{ name: { contains: term, mode: 'insensitive' } },
										{ description: { contains: term, mode: 'insensitive' } },
									],
								})),
							},
						],
					},
					include: {
						categories: { include: { category: true } },
						reviews: { select: { rating: true } },
					},
					take: 3,
				});

				suggestions = businesses.map(b => ({
					type: 'business',
					data: {
						id: b.id,
						name: b.name,
						slug: b.slug,
						category: b.categories[0]?.category.name,
						rating: b.reviews.length > 0 
							? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length 
							: null,
					},
				}));
			}
		}

		return c.json({
			message: responseContent,
			suggestions,
		});
	} catch (error) {
		console.error('AI chat error:', error);
		return c.json({
			message: 'I apologize, but I encountered an error processing your request. Please try again.',
			suggestions: [],
		});
	}
});

// Helper function to extract search terms from AI response
function extractSearchTerms(text: string): string[] {
	const terms: string[] = [];
	
	// Common business types mentioned
	const businessTypes = ['consultant', 'agency', 'software', 'AI', 'technology', 'marketing', 'data'];
	businessTypes.forEach(type => {
		if (text.toLowerCase().includes(type.toLowerCase())) {
			terms.push(type);
		}
	});

	return Array.from(new Set(terms)); // Remove duplicates
}

export { directoryAiRouter };