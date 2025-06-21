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

		// Create a transform stream to parse SSE format and extract response text
		let buffer = '';
		const transformStream = new TransformStream({
			transform(chunk, controller) {
				const decoder = new TextDecoder();
				const text = decoder.decode(chunk);
				
				// Split into lines and process each one
				const lines = text.split('\n');
				
				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const dataStr = line.slice(6); // Remove 'data: ' prefix
						
						if (dataStr.trim() === '[DONE]') {
							continue;
						}

						buffer += dataStr;
						
						try {
							const data = JSON.parse(buffer);
							if (data.response) {
								controller.enqueue(data.response);
								buffer = '';
							}
						} catch (e) {
							// Incomplete JSON, continue buffering
							continue;
						}
					}
				}
			}
		});

		// Check if result is a Response object with a readable stream
		if (result instanceof Response && result.body) {
			return new Response(result.body.pipeThrough(transformStream), {
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Transfer-Encoding': 'chunked',
				},
			});
		}

		// If it's not a Response object, try to handle it as a ReadableStream
		if (result && typeof result.getReader === 'function') {
			return new Response(result.pipeThrough(transformStream), {
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Transfer-Encoding': 'chunked',
				},
			});
		}

		// Fallback: convert to string if it's not streamable
		const text = typeof result === 'string' ? result : JSON.stringify(result);
		return new Response(text, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
			},
		});
	} catch (error) {
		console.error('AutoRAG Stream API error:', error);
		return new Response(`Error: ${error.message}`, { status: 500 });
	}
};
