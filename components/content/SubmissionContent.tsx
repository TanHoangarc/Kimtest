
import React, { useState, useRef, useEffect } from 'react';
import { addNotification } from '../../utils/notifications';
import { User, SubmissionData } from '../../types';

interface SubmissionContentProps {
  back: () => void;
}

const UPLOAD_API_ENDPOINT = '/api/upload';
const STORE_API_ENDPOINT = '/api/store';
const DATA_KEY = 'kimberry_submission_data';
const STORE_URL_KEY = 'kimberry_submission_store_url';
const LOCAL_MIRROR_KEY = 'kimberry-refund-submissions';
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

const SubmissionContent: React.FC<SubmissionContentProps> = ({ back }) => {
  const [jobId, setJobId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string, url?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [userRole, setUserRole] = useState<'Admin' | 'Document' | 'Customer' | null>(null);

  // --- Helper Functions for Cloud Sync ---

  const fetchRemoteData = async (): Promise<SubmissionData[] | null> => {
      try {
          const cachedUrl = localStorage.getItem(STORE_URL_KEY);
          let apiUrl = `${STORE_API_ENDPOINT}?key=${DATA_KEY}`;
          if (cachedUrl) {
              apiUrl += `&url=${encodeURIComponent(cachedUrl)}`;
          }

          const res = await fetch(`${apiUrl}&_t=${Date.now()}`);
          if (res.ok) {
              const responseJson = await res.json();
              const { data, url } = responseJson;
              if (url) {
                  localStorage.setItem(STORE_URL_KEY, url);
              }
              if (Array.isArray(data)) return data;
              return data ? [] : null;
          } else {
             console.warn("Fetch submission data failed:", res.status);
             return null;
          }
      } catch (e) {
          console.error("Failed to fetch submission data", e);
          return null;
      }
  };

  const saveRemoteData = async (data: SubmissionData[]) => {
      try {
          const res = await fetch(`${STORE_API_ENDPOINT}?key=${DATA_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data })
          });
          
          if (res.ok) {
            const result = await res.json();
            if (result.url) {
                localStorage.setItem(STORE_URL_KEY, result.url);
            }
          } else {
              let errorMsg = `Lỗi ${res.status} (${res.statusText})`;
              try {
                 const contentType = res.headers.get("content-type");
                 if (contentType && contentType.indexOf("application/json") !== -1) {
                     const errData = await res.json();
                     if (errData.error) errorMsg += `: ${errData.error}`;
                     if (errData.details) errorMsg += ` - ${errData.details}`;
                 } else {
                     const text = await res.text();
                     if (text) errorMsg += `: ${text.substring(0, 100)}...`;
                 }
              } catch (e) {
                 // Ignore
              }
              throw new Error(errorMsg);
          }
      } catch (e) {
          console.error("Failed to save submission data", e);
          throw e;
      }
  };

  const refreshData = async () => {
      setIsLoadingData(true);
      const data = await fetchRemoteData();
      if (data) {
          setSubmissions(data);
          localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(data));
          window.dispatchEvent(new CustomEvent('pending_lists_updated'));
      }
      setIsLoadingData(false);
  };
  // ---------------------------------------

  useEffect(() => {
    refreshData();

    try {
      const userEmailRaw = localStorage.getItem('user');
      const allUsersRaw = localStorage.getItem('users');
      if (userEmailRaw && allUsersRaw) {
        const loggedInUserEmail = JSON.parse(userEmailRaw).email;
        const parsedUsers = JSON.parse(allUsersRaw);
        if (Array.isArray(parsedUsers)) {
          const allUsers: User[] = parsedUsers;
          const currentUser = allUsers.find(u => u.email === loggedInUserEmail);
          if (currentUser) {
            setUserRole(currentUser.role);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load user role", error);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
          setUploadStatus({ type: 'error', message: 'File quá lớn (> 4MB). Vui lòng chọn file nhỏ hơn.' });
          event.target.value = ''; 
          setSelectedFile(null);
          return;
      }
      setSelectedFile(file);
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
    setUploadStatus({ type: 'info', message: 'B1: Đang tải file lên hệ thống...' });

    const searchParams = new URLSearchParams({
        jobId: jobId,
        filename: selectedFile.name,
        uploadPath: 'CVHC'
    });

    try {
      // 1. Upload
      const response = await fetch(`${UPLOAD_API_ENDPOINT}?${searchParams.toString()}`, {
        method: 'POST',
        body: selectedFile,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || result.details || `Lỗi upload (Status: ${response.status})`);
      }
      const result = await response.json();
      
      setUploadStatus({ type: 'info', message: 'B2: Tải file xong. Đang lưu dữ liệu...' });

      const newSubmission: SubmissionData = {
        id: Date.now().toString(),
        hbl: jobId,
        fileUrl: result.url,
        fileName: selectedFile.name,
      };

      // 2. Update DB
      const currentData = await fetchRemoteData();
      // CRITICAL: Do not proceed if data fetch fails
      // Note: empty array is valid, null is error
      if (currentData === null) {
           throw new Error("Không thể lấy dữ liệu hiện tại. Vui lòng thử lại.");
      }
      
      const validData = currentData || [];
      const updatedData = [newSubmission, ...validData];
      
      await saveRemoteData(updatedData);
      
      setSubmissions(updatedData);
      localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(updatedData));
      window.dispatchEvent(new CustomEvent('pending_lists_updated'));
      
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const currentUser: Partial<User> = JSON.parse(userRaw);
        addNotification({
          userEmail: currentUser.email || 'Unknown User',
          action: 'Nộp hồ sơ hoàn cược',
          details: `HBL: ${jobId}`
        });
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
        setUploadStatus({ type: 'error', message: `Thất bại: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCompleteSubmission = async (idToComplete: string) => {
    if (window.confirm('Bạn có chắc chắn muốn hoàn thành và xóa mục này?')) {
      setIsUploading(true); 
      try {
          const currentData = await fetchRemoteData();
          if (!currentData) throw new Error("Mất kết nối với dữ liệu server.");

          const updatedData = currentData.filter(sub => sub.id !== idToComplete);
          await saveRemoteData(updatedData);
          
          setSubmissions(updatedData);
          localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(updatedData));
          window.dispatchEvent(new CustomEvent('pending_lists_updated'));
      } catch (e) {
          const error = e as Error;
          alert(`Không thể xóa mục. Lỗi: ${error.message}`);
      } finally {
          setIsUploading(false);
      }
    }
  };

  const statusColor = {
    success: 'text-green-600 bg-green-100 border-green-300',
    error: 'text-red-600 bg-red-100 border-red-300',
    info: 'text-blue-600 bg-blue-100 border-blue-300',
  };
  
  const isAdmin = userRole === 'Admin';

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <p>Nộp hồ sơ hoàn cược. Vui lòng điền đúng thông tin số HBL có dạng KML.... và tải lên file của bạn.</p>
            <button 
                onClick={refreshData} 
                disabled={isLoadingData}
                className="flex items-center gap-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium transition-colors"
            >
                <span className={`${isLoadingData ? 'animate-spin' : ''}`}>🔄</span>
                {isLoadingData ? 'Đang tải...' : 'Làm mới'}
            </button>
        </div>

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
            Chọn File (Tối đa 4MB)
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
              {isUploading ? 'Đang xử lý...' : 'Nộp hồ sơ'}
            </button>
        </div>
      </form>

      {isAdmin && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Danh sách hồ sơ chờ xử lý ({submissions.length})</h3>
          {submissions.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 font-semibold">HBL</th>
                    <th className="p-3 font-semibold">Hồ sơ</th>
                    <th className="p-3 font-semibold text-right">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3 whitespace-nowrap font-medium text-gray-800">{sub.hbl}</td>
                      <td className="p-3 whitespace-nowrap">
                        <a 
                          href={sub.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                          title={sub.fileName}
                        >
                          Xem file
                        </a>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleCompleteSubmission(sub.id)}
                          disabled={isUploading}
                          className="px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition-colors disabled:bg-gray-400"
                        >
                          Hoàn thành
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4 bg-gray-50 rounded-md">Không có hồ sơ nào đang chờ xử lý.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SubmissionContent;
