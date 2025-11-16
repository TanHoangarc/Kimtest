
import React, { useState, useRef } from 'react';

interface SubmissionContentProps {
  back: () => void;
}

// The new endpoint for our Vercel Serverless Function
const UPLOAD_API_ENDPOINT = '/api/upload';

const SubmissionContent: React.FC<SubmissionContentProps> = ({ back }) => {
  const [jobId, setJobId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string, url?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadStatus(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!jobId || !selectedFile) {
      setUploadStatus({ type: 'error', message: 'Vui lòng nhập HBL và chọn một file.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: 'info', message: 'Đang tải file lên hệ thống...' });

    // We pass jobId and filename as query parameters
    const searchParams = new URLSearchParams({
        jobId: jobId,
        filename: selectedFile.name
    });

    try {
      const response = await fetch(`${UPLOAD_API_ENDPOINT}?${searchParams.toString()}`, {
        method: 'POST',
        body: selectedFile, // The raw file is sent as the body
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra khi tải file.');
      }
      
      setUploadStatus({ 
        type: 'success', 
        message: result.message || 'Tải file lên thành công!',
        url: result.url
      });
      setJobId('');
      setSelectedFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
        const err = error as Error;
        console.error('Upload error:', err);
        setUploadStatus({ type: 'error', message: `Tải file thất bại: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };
  
  const statusColor = {
    success: 'text-green-600 bg-green-100 border-green-300',
    error: 'text-red-600 bg-red-100 border-red-300',
    info: 'text-blue-600 bg-blue-100 border-blue-300',
  };

  return (
    <div>
      <p className="mb-4">Nộp hồ sơ hoàn cược. Vui lòng điền đúng thông tin số HBL có dạng KML.... và tải lên file của bạn.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-1">
            Job ID
          </label>
          <input
            type="text"
            id="jobId"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Nhập số HBL..."
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#5c9ead] focus:border-transparent outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
            Chọn File
          </label>
          <input
            type="file"
            id="fileUpload"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-[#a8d0a2] file:text-gray-800
              hover:file:bg-[#5c9ead] hover:file:text-white"
            required
          />
        </div>
        
        {uploadStatus && (
            <div className={`p-3 rounded-md border ${statusColor[uploadStatus.type]}`}>
                <p>{uploadStatus.message}</p>
                {uploadStatus.url && (
                    <p className="mt-2">
                        <span className="font-semibold">URL file:</span>{' '}
                        <a href={uploadStatus.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                            {uploadStatus.url}
                        </a>
                    </p>
                )}
            </div>
        )}

        <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2 bg-[#184d47] text-white border-none rounded-md cursor-pointer hover:bg-opacity-80 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Đang nộp...' : 'Nộp hồ sơ'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default SubmissionContent;