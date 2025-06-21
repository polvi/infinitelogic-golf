import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
	console.log('API: Stream endpoint called');
	try {
		const { query } = await request.json();
		console.log('API: Received query:', query);
		
		if (!query) {
			console.log('API: No query provided');
			return new Response('Query is required', { status: 400 });
		}

		// Access the AI binding from Cloudflare runtime
		const { env } = locals.runtime;
		
		if (!env?.AI) {
			return new Response('AI binding not available', { status: 500 });
		}

		console.log('API: Starting AutoRAG search');
		// Use AutoRAG's streaming functionality
		const result = await env.AI.autorag("aopa-rag").aiSearch({
			query: query,
			stream: true,
		});
		console.log('API: Got AutoRAG result:', typeof result);

		// Return the raw stream directly
		console.log('API: Returning stream response');
		return new Response(result as ReadableStream, {
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
