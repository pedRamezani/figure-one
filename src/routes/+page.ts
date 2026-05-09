import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch }) => {
  const id = url.searchParams.get('id');

  // If there's no ID, we just load the normal app state
  if (!id) {
    return {
      sharedState: null, error: null
    };
  }

  // Fetch the encrypted data from your API
  const response = await fetch(`/api/share/${id}`);

  if (!response.ok) {
    return { 
      sharedState: null, 
      error: response.status === 404 ? 'Link expired' : 'Server error' 
    };
  }

  const { data } = await response.json() as { data: string };

  return {
    sharedState: data, // This is the encrypted base64 string
    error: null
  };
}