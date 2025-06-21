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
		
		if (!result.body?.getReader) {
			throw new Error("Streaming not supported");
		}
		
		// Create a readable stream that processes the SSE data
		const stream = new ReadableStream({
			async start(controller) {
				const reader = result.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";
				
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						
						if (value) {
							buffer += decoder.decode(value, { stream: true });
							const lines = buffer.split(/\r?\n/);
							buffer = lines.pop() ?? "";
							
							for (const line of lines) {
								if (line.startsWith("data:")) {
									const jsonStr = line.slice(5).trim();
									if (jsonStr) {
										try {
											const obj = JSON.parse(jsonStr);
											// Extract only the 'response' text and stream it
											if (typeof obj.response === "string") {
												const chunk = new TextEncoder().encode(obj.response);
												controller.enqueue(chunk);
												// Force flush by yielding control
												await new Promise(resolve => setTimeout(resolve, 0));
											}
										} catch {
											// Ignore invalid JSON lines
										}
									}
								}
							}
						}
					}
					
					// Handle any remaining buffered line
					if (buffer.startsWith("data:")) {
						const jsonStr = buffer.slice(5).trim();
						if (jsonStr) {
							try {
								const obj = JSON.parse(jsonStr);
								if (typeof obj.response === "string") {
									controller.enqueue(new TextEncoder().encode(obj.response));
								}
							} catch {}
						}
					}
				} catch (error) {
					controller.error(error);
				} finally {
					controller.close();
				}
			}
		});
		
		return new Response(stream, {
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
