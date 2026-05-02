import { json, error } from '@sveltejs/kit';

// GET: Retrieve the encrypted state
export async function GET({ params, platform }) {
  const object = await platform?.env.STATE_BUCKET.get(params.id);

  if (!object) {
    throw error(404, 'State not found or expired');
  }

  const data = await object.text();
  return json({ data });
}