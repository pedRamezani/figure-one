import { error, json } from '@sveltejs/kit';

// POST: Save encrypted state
export async function POST({ request, platform }) {
    // 1. Security: Check Content-Length to prevent abuse
    const size = parseInt(request.headers.get('content-length') || '0');
    if (size > 2 * 1024 * 1024) { // 2MB limit
        throw error(413, 'Payload too large');
    }
    
    const { payload } = await request.json() as { payload: string };
    const id = crypto.randomUUID();

    // 2. Store in R2
    await platform?.env.STATE_BUCKET.put(id, payload, {
        httpMetadata: { contentType: 'text/plain' },
        customMetadata: { 'Uploaded-At': new Date().toISOString() }
    });

    return json({ id });
}