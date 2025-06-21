import type { APIRoute } from 'astro';
import { createWorkersAI } from 'workers-ai-provider';
import { streamText } from 'ai';

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

		const workersai = createWorkersAI({ binding: env.AI });
		
		const result = streamText({
			model: workersai('@cf/meta/llama-3.1-8b-instruct'),
			prompt: `Answer this question based on your knowledge: ${query}`,
		});

		return result.toTextStreamResponse({
			headers: {
				'Content-Type': 'text/x-unknown',
				'content-encoding': 'identity',
				'transfer-encoding': 'chunked',
			},
		});
	} catch (error) {
		console.error('Stream API error:', error);
		return new Response(`Error: ${error.message}`, { status: 500 });
	}
};
