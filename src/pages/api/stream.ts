import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const { query } = await request.json() as { query: string };
		
		if (!query) {
			return new Response('Query is required', { status: 400 });
		}
		
		// Access the AI binding from Cloudflare runtime
		const { env } = locals.runtime;
		
		if (!env?.AI) {
			return new Response('AI binding not available', { status: 500 });
		}
		
		// Use your AutoRAG with streaming enabled
		const result = await env.AI.autorag("aopa-rag").aiSearch({
			query: query,
			stream: true,
		});
		
		// The result is already a Response object with a stream, so we need to return it directly
		// but with our custom headers
		return new Response(result.body, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	} catch (error) {
		console.error('Error in streaming:', error);
		return new Response(`Internal Server Error: ${error}`, { status: 500 });
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
};
