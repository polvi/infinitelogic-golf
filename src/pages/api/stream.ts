import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const { query } = await request.json();
		
		if (!query) {
			return new Response('Query is required', { status: 400 });
		}

		// Access the AI binding from Cloudflare runtime
		const { env } = locals.runtime;
		
		if (!env?.AI) {
			return new Response('AI binding not available', { status: 500 });
		}

		// Use AutoRAG's streaming functionality
		const result = await env.AI.autorag("aopa-rag").aiSearch({
			query: query,
			stream: true,
		});

		// Return the streaming response from AutoRAG
		return new Response(result, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Transfer-Encoding': 'chunked',
			},
		});
	} catch (error) {
		console.error('AutoRAG Stream API error:', error);
		return new Response(`Error: ${error.message}`, { status: 500 });
	}
};
