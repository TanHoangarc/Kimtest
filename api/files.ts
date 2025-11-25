
import { list } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Check for required environment variable
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Missing BLOB_READ_WRITE_TOKEN environment variable.');
    return res.status(500).json({ 
        error: 'Server Misconfiguration', 
        details: 'BLOB_READ_WRITE_TOKEN environment variable is missing. Please configure it in your Vercel project settings.' 
    });
  }

  try {
    // List blobs (default limit is 1000, usually sufficient for this use case)
    const { blobs } = await list({ limit: 1000 });
    
    // Return standard blob metadata: url, pathname, size, uploadedAt
    return res.status(200).json({ files: blobs });

  } catch (error) {
    console.error('Error listing Vercel Blobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to list files.', details: errorMessage });
  }
}
