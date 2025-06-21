import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const { query } = await request.json() as { query: string };
		
		if (!query) {
			return new Response('Query is required', { status: 400 });
		}
		
		// Access the AI binding from locals (set by Cloudflare adapter)
		const AI = (locals.runtime?.env as any)?.AI;
		
		if (!AI) {
			return new Response('AI binding not available', { status: 500 });
		}
		
		// Use your AutoRAG with streaming enabled
		const result = await AI.autorag("aopa-rag").aiSearch({
			query: query,
			model: "@cf/meta/llama-3.1-8b-instruct",
			rewrite_query: true,
			max_num_results: 5,
			ranking_options: {
				score_threshold: 0.3,
			},
			stream: true,
		});
		
		// Return the streaming response with appropriate headers
		return new Response(result, {
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
