
import { put, list } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure CORS headers to prevent browser blocking
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Prevent Caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const action = req.query.action as string;

    // --- HANDLE LIST ACTION (GET) ---
    if (req.method === 'GET' && action === 'list') {
        const { blobs } = await list({ limit: 1000 });
        return res.status(200).json({ files: blobs });
    }

    // --- STANDARD STORE LOGIC ---
    let body = req.body;
    if (typeof body === 'string') {
        try {
        body = JSON.parse(body);
        } catch (e) {
        console.error('JSON Parse Error in Store API:', e);
        }
    }

    const key = req.query.key as string || (body && typeof body === 'object' && body.key);
    const directUrl = req.query.url as string;

    // --- GET DATA ---
    if (req.method === 'GET') {
        if (!key && !directUrl) {
            return res.status(400).json({ error: 'Missing "key" or "url" parameter.' });
        }

        let url = directUrl;
        
        if (!url) {
            const filePath = `db/${key}.json`;
            const { blobs } = await list({ prefix: filePath, limit: 1 });
            if (blobs.length > 0) {
                url = blobs[0].url;
            }
        }

        if (!url) {
            return res.status(200).json({ data: null, url: null }); 
        }

        const response = await fetch(`${url}?t=${Date.now()}`, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
            return res.status(200).json({ data: null, url: null });
        }
        
        const data = await response.json();
        return res.status(200).json({ data, url });
    }

    // --- POST DATA ---
    if (req.method === 'POST') {
        // --- NEW: HANDLE LIST ACTION (POST) ---
        // Robust fallback for environments where GET query params fail routing
        if (body && body.action === 'list') {
             const { blobs } = await list({ limit: 1000 });
             return res.status(200).json({ files: blobs });
        }

        if (!key) {
            return res.status(400).json({ error: 'Missing "key" parameter.' });
        }

        if (!body || typeof body !== 'object') {
            return res.status(400).json({ error: 'Invalid JSON body.' });
        }

        const data = body.data;
        if (data === undefined) {
            return res.status(400).json({ error: 'Missing "data" field.' });
        }

        const filePath = `db/${key}.json`;

        const blob = await put(filePath, JSON.stringify(data), { 
            access: 'public', 
            addRandomSuffix: false,
            contentType: 'application/json',
            // @ts-ignore: Vercel Blob requires this flag
            allowOverwrite: true
        });
        
        return res.status(200).json({ success: true, url: blob.url });
    }

    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('API Store Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}
