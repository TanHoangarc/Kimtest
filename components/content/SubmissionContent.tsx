
import React, { useState, useRef } from 'react';
import BackButton from '../BackButton';

interface SubmissionContentProps {
  back: () => void;
}

// IMPORTANT: To make this work outside your local network (LAN),
// you must expose your server to the internet and replace 'http://localhost:3000'
// with your server's public URL.
// A tool like ngrok (https://ngrok.com/) can help you create a public URL for your local server for testing.
const SERVER_URL = 'http://localhost:3000';

const SubmissionContent: React.FC<SubmissionContentProps> = ({ back }) => {
  const [jobId, setJobId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
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
      setUploadStatus({ type: 'error', message: 'Vui lòng nhập Job ID và chọn một file.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: 'info', message: 'Đang tải file lên...' });

    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Có lỗi xảy ra khi tải file.');
      }
      
      setUploadStatus({ type: 'success', message: 'Tải file lên thành công! ' + result.message });
      setJobId('');
      setSelectedFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
        const err = error as Error;
        console.error('Upload error:', err);
        setUploadStatus({ type: 'error', message: `Không thể kết nối đến server tại ${SERVER_URL}. Vui lòng kiểm tra lại URL và đảm bảo server của bạn đang chạy và có thể truy cập từ internet.` });
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
      <p className="mb-4">Nộp hồ sơ liên quan đến một Job ID cụ thể. Vui lòng điền thông tin và tải lên file của bạn.</p>
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
            placeholder="Nhập mã Job..."
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
            </div>
        )}

        <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2 bg-[#184d47] text-white border-none rounded-md cursor-pointer hover:bg-opacity-80 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Đang nộp...' : 'Nộp hồ sơ'}
            </button>
            <BackButton onClick={back} />
        </div>
      </form>
    </div>
  );
};

export default SubmissionContent;