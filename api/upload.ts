
import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

function sanitizeFilename(filename: string): string {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
  }

  const filename = request.query.filename as string;
  const jobId = request.query.jobId as string;
  const uploadPath = request.query.uploadPath as string;

  if (!filename || !jobId || !uploadPath) {
    return response.status(400).json({ error: 'Thiếu thông tin Filename, JobId hoặc uploadPath.' });
  }
  
  const allowedPaths = ['CVHC', 'MBL', 'DONE'];
  if (!allowedPaths.includes(uploadPath)) {
      return response.status(400).json({ error: 'Đường dẫn upload không hợp lệ.' });
  }

  // Limit 4MB
  const MAX_SIZE = 4 * 1024 * 1024;
  const contentLength = request.headers['content-length'];
  if (contentLength && parseInt(contentLength) > MAX_SIZE) {
    return response.status(413).json({ 
      error: 'File quá lớn (Server). Vui lòng nén file dưới 4MB.' 
    });
  }

  try {
    const parts = filename.split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    const nameBase = parts.join('.');
    
    const safeName = sanitizeFilename(nameBase);
    const finalFilename = ext ? `${safeName}.${ext}` : safeName;
    // Fallback if filename becomes empty after sanitize
    const validFilename = finalFilename.trim() === '' || finalFilename === '.' ? `file_${Date.now()}` : finalFilename;

    const blobPath = `${uploadPath}/${jobId}/${validFilename}`;

    const blob = await put(blobPath, request, {
      access: 'public',
    });

    return response.status(200).json({
        message: `Upload thành công.`,
        url: blob.url 
    });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    
    return response.status(500).json({ error: 'Upload thất bại.', details: errorMessage });
  }
}
