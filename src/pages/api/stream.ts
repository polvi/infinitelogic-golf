import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const { query, isFollowUp, previousResponse } = await request.json();
		
		if (!query) {
			return new Response('Query is required', { status: 400 });
		}

		// Access the AI binding from Cloudflare runtime
		const { env } = locals.runtime;
		
		if (!env?.AI) {
			return new Response('AI binding not available', { status: 500 });
		}

		// Modify query for follow-ups to maintain context
		const finalQuery = isFollowUp 
			? `Based on this previous context: "${previousResponse}", ${query}. Please provide new information that wasn't covered before.`
			: query;

		// Use AutoRAG's streaming functionality
		const result = await env.AI.autorag("aopa-rag").aiSearch({
			query: finalQuery,
			stream: true,
		});

		// If result is already a Response, return its body as a new Response
		if (result instanceof Response) {
			return new Response(result.body, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
				},
			});
		}

		// If it's already a ReadableStream, return it directly
		return new Response(result, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
			},
		});
	} catch (error) {
		console.error('AutoRAG Stream API error:', error);
		return new Response(`Error: ${error.message}`, { status: 500 });
	}
};
