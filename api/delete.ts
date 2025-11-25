import { del } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
  }

  const { url } = request.body;

  if (!url) {
    return response.status(400).json({ error: 'URL parameter is required in the request body.' });
  }

  try {
    await del(url);
    return response.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return response.status(500).json({ error: 'Failed to delete file.', details: errorMessage });
  }
}
