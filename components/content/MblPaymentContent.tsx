
import React, { useState, useEffect, useRef } from 'react';
import { MblPaymentData, User } from '../../types';
import { addNotification } from '../../utils/notifications';


const UPLOAD_API_ENDPOINT = '/api/upload';
const STORE_API_ENDPOINT = '/api/store';
const DATA_KEY = 'mbl_full_data';
const STORE_URL_KEY = 'kimberry_mbl_store_url'; 
const LOCAL_MIRROR_KEY = 'kimberry-mbl-payment-data';
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

const DEFAULT_MA_LINE_OPTIONS = [
    'EVERGREEN', 'ONE', 'WANHAI', 'COSCO', 'COSCO-HP', 'TSLHN', 'SITC', 'AEC',
    'MSC-HCM', 'MSC-HP', 'HAIAN-HCM', 'HAIAN-HP', 'MAERSK', 'JINJIANG', 'ORIMAS',
    'RCL', 'OOCL', 'CMACGM', 'MARINE-HP', 'SINOVITRANS', 'SNVT-HP', 'HAPAG-LLOYD'
].sort();

interface MblRemoteData {
    pending: MblPaymentData[];
    completed: MblPaymentData[];
    options: string[];
}

interface MblPaymentContentProps {
  back: () => void;
}

const initialFormData: { maLine: string; soTien: number | string; mbl: string } = {
    maLine: '',
    soTien: '',
    mbl: '',
};

const MblPaymentContent: React.FC<MblPaymentContentProps> = ({ back }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [entries, setEntries] = useState<MblPaymentData[]>([]);
    const [completedEntries, setCompletedEntries] = useState<MblPaymentData[]>([]);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [completingEntryId, setCompletingEntryId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'Admin' | 'Document' | 'Customer' | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uncFileRef = useRef<HTMLInputElement>(null);
    
    const [maLineOptions, setMaLineOptions] = useState<string[]>(DEFAULT_MA_LINE_OPTIONS);
    const [newMaLine, setNewMaLine] = useState('');
    const [isAddingMaLine, setIsAddingMaLine] = useState(false);

    // Helper to fetch data from server
    const fetchRemoteData = async (): Promise<MblRemoteData | null> => {
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
                return data;
            } else {
                console.warn("Fetch data returned non-200 status:", res.status);
                return null;
            }
        } catch (e) {
            console.error("Failed to fetch remote data", e);
            return null;
        }
    };

    const saveRemoteData = async (data: MblRemoteData) => {
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
                    // Ignore parsing error
                 }
                 throw new Error(errorMsg);
            }
        } catch (e) {
            console.error("Failed to save remote data", e);
            throw e;
        }
    };

    const refreshData = async () => {
        setIsLoadingData(true);
        const data = await fetchRemoteData();
        if (data) {
            setEntries(data.pending || []);
            setCompletedEntries(data.completed || []);
            setMaLineOptions(data.options && data.options.length > 0 ? data.options : DEFAULT_MA_LINE_OPTIONS);
            
            localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(data.pending || []));
            window.dispatchEvent(new CustomEvent('pending_lists_updated'));
        } else {
             // Only reset if we strictly can't load, but keep existing if network fail? 
             // Ideally we warn user. For now, we keep defaults or empty.
             // setMaLineOptions(DEFAULT_MA_LINE_OPTIONS); 
        }
        setIsLoadingData(false);
    };

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
                setStatus({ type: 'error', message: 'File quá lớn (> 4MB). Vui lòng chọn file nhỏ hơn.' });
                event.target.value = '';
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setStatus(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'soTien') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue ? parseInt(numericValue, 10) : '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleAddMaLine = async () => {
        const trimmedNewLine = newMaLine.trim().toUpperCase();
        if (!trimmedNewLine) {
            setStatus({ type: 'error', message: 'Tên Mã Line mới không được để trống.' });
            return;
        }
        
        setIsLoadingData(true);
        try {
            const currentData = await fetchRemoteData();
            if (!currentData) throw new Error("Không thể tải dữ liệu hiện tại. Vui lòng thử lại.");
            
            if (currentData.options.some(option => option.toLowerCase() === trimmedNewLine.toLowerCase())) {
                setStatus({ type: 'error', message: `Mã Line "${trimmedNewLine}" đã tồn tại.` });
                setIsLoadingData(false);
                return;
            }

            const newOptions = [...currentData.options, trimmedNewLine].sort();
            
            await saveRemoteData({
                ...currentData,
                options: newOptions
            });
            
            setMaLineOptions(newOptions);
            setNewMaLine('');
            setStatus({ type: 'success', message: `Đã thêm thành công Mã Line "${trimmedNewLine}".` });
            setIsAddingMaLine(false);
        } catch (err) {
             const error = err as Error;
             setStatus({ type: 'error', message: `Lỗi khi lưu Mã Line mới: ${error.message}` });
        } finally {
            setIsLoadingData(false);
        }
    };


    const handleAddEntry = async () => {
        if (!formData.maLine || !selectedFile) {
            setStatus({ type: 'error', message: 'Vui lòng chọn Mã Line và chọn hóa đơn.' });
            return;
        }

        setIsUploading(true);
        setStatus({ type: 'info', message: 'Đang tải hóa đơn...' });

        const searchParams = new URLSearchParams({
            jobId: `MBL-${formData.maLine}-${Date.now()}`,
            filename: selectedFile.name,
            uploadPath: 'MBL'
        });

        try {
            // 1. Upload File
            const response = await fetch(`${UPLOAD_API_ENDPOINT}?${searchParams.toString()}`, {
                method: 'POST',
                body: selectedFile,
            });

            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || result.details || 'Lỗi server upload file');
            }
            const result = await response.json();

            setStatus({ type: 'info', message: 'Đã tải hóa đơn. Đang lưu dữ liệu...' });

            // 2. Save Data
            const newEntry: MblPaymentData = {
                id: Date.now().toString(),
                ...formData,
                soTien: formData.soTien || 0,
                hoaDonUrl: result.url,
                hoaDonFilename: selectedFile.name,
            };
            
            const currentData = await fetchRemoteData();
            // CRITICAL: If we can't read DB, DO NOT overwrite.
            if (!currentData) {
                throw new Error("Mất kết nối với cơ sở dữ liệu. Dữ liệu chưa được lưu. Vui lòng thử lại.");
            }
            
            const updatedPending = [...(currentData.pending || []), newEntry];
            
            await saveRemoteData({
                ...currentData,
                pending: updatedPending
            });

            setEntries(updatedPending);
            localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(updatedPending));
            window.dispatchEvent(new CustomEvent('pending_lists_updated'));
            
            const userRaw = localStorage.getItem('user');
            if (userRaw) {
                const currentUser: Partial<User> = JSON.parse(userRaw);
                addNotification({
                  userEmail: currentUser.email || 'Unknown User',
                  action: 'Thêm thanh toán MBL',
                  details: `Mã Line: ${newEntry.maLine}`
                });
            }

            setFormData(initialFormData);
            setSelectedFile(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
            setStatus({ type: 'success', message: `Đã thêm thanh toán cho Mã Line "${newEntry.maLine}".` });

        } catch (error) {
            const err = error as Error;
            setStatus({ type: 'error', message: `Thất bại: ${err.message}` });
        } finally {
            setIsUploading(false);
        }
    };

    const handleLoadForEditing = async (idToLoad: string) => {
        const entryToLoad = entries.find(entry => entry.id === idToLoad);
        if (entryToLoad) {
            const { maLine, soTien, mbl } = entryToLoad;
            setFormData({ maLine, soTien, mbl });

            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            setIsLoadingData(true);
            try {
                 const currentData = await fetchRemoteData();
                 if (!currentData) throw new Error("Không thể tải dữ liệu từ server.");

                 const updatedPending = currentData.pending.filter(e => e.id !== idToLoad);
                 
                 await saveRemoteData({ ...currentData, pending: updatedPending });
                 
                 setEntries(updatedPending);
                 localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(updatedPending));
                 window.dispatchEvent(new CustomEvent('pending_lists_updated'));

                 setStatus({ type: 'info', message: `Đã tải ${entryToLoad.mbl || entryToLoad.maLine} lên để chỉnh sửa. Vui lòng chọn lại file hóa đơn.` });
            } catch (e) {
                const error = e as Error;
                setStatus({ type: 'error', message: `Lỗi khi tải dữ liệu chỉnh sửa: ${error.message}` });
            } finally {
                setIsLoadingData(false);
            }
        }
    };

    const handleCompleteClick = (idToComplete: string) => {
        setCompletingEntryId(idToComplete);
        if (uncFileRef.current) {
            uncFileRef.current.value = '';
            uncFileRef.current.click();
        }
    };
    
    const handleUncFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !completingEntryId) {
            setCompletingEntryId(null);
            return;
        }

        const uncFile = event.target.files[0];
        const originalEntry = entries.find(e => e.id === completingEntryId);

        if (!originalEntry) {
            setStatus({ type: 'error', message: 'Không tìm thấy mục gốc để hoàn thành.' });
            setCompletingEntryId(null);
            return;
        }

        if (uncFile.size > MAX_FILE_SIZE) {
             setStatus({ type: 'error', message: 'File UNC quá lớn (> 4MB). Vui lòng nén nhỏ lại.' });
             setCompletingEntryId(null);
             return;
        }
        
        setIsUploading(true);
        setStatus({ type: 'info', message: `B1: Đang tải file UNC lên Server...` });

        const searchParams = new URLSearchParams({
            jobId: `DONE-${originalEntry.maLine}-${originalEntry.id}`,
            filename: uncFile.name,
            uploadPath: 'DONE'
        });

        try {
            // 1. Upload UNC
            const response = await fetch(`${UPLOAD_API_ENDPOINT}?${searchParams.toString()}`, {
                method: 'POST',
                body: uncFile,
            });

            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || result.details || `Lỗi upload (Status: ${response.status})`);
            }
            const result = await response.json();
            
            setStatus({ type: 'info', message: `B2: Đã tải file xong. Đang cập nhật dữ liệu...` });

            const completedEntry: MblPaymentData = {
                ...originalEntry,
                hoaDonUrl: result.url,
                hoaDonFilename: uncFile.name,
            };

            // 2. Update DB
            const currentData = await fetchRemoteData();
            // CRITICAL: If fetch fails, DO NOT proceed, otherwise we wipe the DB.
            if (!currentData) {
                 throw new Error("File đã lên nhưng KHÔNG THỂ LƯU dữ liệu vào hệ thống. Vui lòng thử lại sau giây lát.");
            }
            
            const updatedPending = currentData.pending.filter(entry => entry.id !== completingEntryId);
            const updatedCompleted = [...currentData.completed, completedEntry];

            await saveRemoteData({
                ...currentData,
                pending: updatedPending,
                completed: updatedCompleted
            });

            setEntries(updatedPending);
            setCompletedEntries(updatedCompleted);
            
            localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(updatedPending));
            window.dispatchEvent(new CustomEvent('pending_lists_updated'));

            setStatus({ type: 'success', message: `Đã hoàn thành thanh toán cho Mã Line "${originalEntry.maLine}".` });

        } catch (error) {
            const err = error as Error;
            setStatus({ type: 'error', message: `Thất bại: ${err.message}` });
        } finally {
            setIsUploading(false);
            setCompletingEntryId(null);
        }
    };

    const handleDeleteCompleted = async (entryToDelete: MblPaymentData) => {
        if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn mục đã thanh toán này? Thao tác này cũng sẽ xóa file UNC khỏi máy chủ.')) {
            return;
        }

        const urlToDelete = entryToDelete.hoaDonUrl;
        setStatus({ type: 'info', message: 'Đang xóa file và mục...' });
        
        try {
            if (urlToDelete) {
                const response = await fetch('/api/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: urlToDelete }),
                });

                if (!response.ok) {
                    console.warn("Could not delete file blob", await response.json());
                }
            }
            
            const currentData = await fetchRemoteData();
            if (!currentData) throw new Error("Không thể đồng bộ dữ liệu xóa.");

            const updatedCompleted = currentData.completed.filter(entry => entry.id !== entryToDelete.id);
            await saveRemoteData({ ...currentData, completed: updatedCompleted });

            setCompletedEntries(updatedCompleted);
            setStatus({ type: 'success', message: 'Đã xóa thành công mục và file UNC.' });

        } catch (error) {
            const err = error as Error;
            console.error('Delete error:', err);
            setStatus({ type: 'error', message: `Xóa thất bại: ${err.message}. Mục chưa được xóa.` });
        }
    };
    
    const handleDownloadUnc = async (entry: MblPaymentData) => {
        setStatus({ type: 'info', message: `Đang chuẩn bị tải UNC cho MBL ${entry.mbl}...` });
        try {
            const response = await fetch(entry.hoaDonUrl);
            if (!response.ok) {
                throw new Error('Không thể tải file từ server.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            const filename = `UNC BL ${entry.mbl || entry.maLine}`;
            const originalFilename = entry.hoaDonFilename || 'file';
            const extension = originalFilename.split('.').pop() || 'pdf';
            a.download = `${filename}.${extension}`;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setStatus({ type: 'success', message: `Đã tải xuống: ${a.download}` });
        } catch (error) {
            const err = error as Error;
            console.error('Download error:', err);
            setStatus({ type: 'error', message: `Tải file thất bại: ${err.message}` });
        }
    };

    const statusColor = {
        success: 'text-green-600 bg-green-100 border-green-300',
        error: 'text-red-600 bg-red-100 border-red-300',
        info: 'text-blue-600 bg-blue-100 border-blue-300',
    };
    
    const isAdmin = userRole === 'Admin';
    const isDocument = userRole === 'Document';

    return (
        <div className="space-y-6">
             <input
                type="file"
                ref={uncFileRef}
                onChange={handleUncFileSelected}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            />
            
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 italic">
                    Dữ liệu thanh toán MBL được đồng bộ hóa trên hệ thống đám mây.
                </p>
                <button 
                    onClick={refreshData} 
                    disabled={isLoadingData}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium transition-colors"
                >
                    <span className={`${isLoadingData ? 'animate-spin' : ''}`}>🔄</span>
                    {isLoadingData ? 'Đang tải...' : 'Làm mới dữ liệu'}
                </button>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Nhập thông tin thanh toán MBL</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Mã Line (*)</label>
                        <div className="flex items-center gap-2">
                            <select
                                name="maLine"
                                value={formData.maLine}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-[#5c9ead] outline-none"
                            >
                                <option value="">--- Chọn Mã Line ---</option>
                                {maLineOptions.map(line => <option key={line} value={line}>{line}</option>)}
                            </select>
                            
                            {!isAddingMaLine ? (
                                <button
                                    onClick={() => setIsAddingMaLine(true)}
                                    className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex-shrink-0"
                                    title="Thêm Mã Line mới"
                                    aria-label="Thêm Mã Line mới"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={newMaLine}
                                        onChange={(e) => setNewMaLine(e.target.value)}
                                        placeholder="Thêm Mã Line mới..."
                                        className="p-2 border rounded-md focus:ring-2 focus:ring-[#5c9ead] outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddMaLine()}
                                        autoFocus
                                    />
                                    <button onClick={handleAddMaLine} className="px-3 py-2 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 transition-colors flex-shrink-0">
                                        + Thêm
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <input
                        name="mbl"
                        value={formData.mbl}
                        onChange={handleChange}
                        placeholder="MBL"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#5c9ead] outline-none"
                    />
                     <input
                        name="soTien"
                        value={formData.soTien ? Number(formData.soTien).toLocaleString('en-US') : ''}
                        onChange={handleChange}
                        placeholder="Số tiền"
                        inputMode="decimal"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#5c9ead] outline-none"
                    />
                    <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-600 mb-1">Upload hóa đơn (*)</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-[#a8d0a2] file:text-gray-800
                              hover:file:bg-[#5c9ead] hover:file:text-white"
                        />
                    </div>
                </div>
                <button onClick={handleAddEntry} disabled={isUploading || isLoadingData} className="mt-4 px-4 py-2 bg-[#5c9ead] text-white rounded-md hover:bg-[#4a8c99] disabled:bg-gray-400">
                    {isUploading ? 'Đang xử lý...' : 'Tạo yêu cầu thanh toán'}
                </button>
            </div>

            {status && <div className={`p-3 rounded-md border ${statusColor[status.type]}`}>{status.message}</div>}

            <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Danh sách chờ thanh toán ({entries.length} mục)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 font-semibold">Mã Line</th>
                                <th className="p-2 font-semibold">MBL</th>
                                <th className="p-2 font-semibold">Số tiền</th>
                                <th className="p-2 font-semibold">Hóa đơn</th>
                                <th className="p-2 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 whitespace-nowrap">{entry.maLine}</td>
                                    <td className="p-2 whitespace-nowrap">{entry.mbl || '-'}</td>
                                    <td className="p-2 whitespace-nowrap">{typeof entry.soTien === 'number' ? entry.soTien.toLocaleString('en-US') : entry.soTien}</td>
                                    <td className="p-2 whitespace-nowrap">
                                        <a href={entry.hoaDonUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={entry.hoaDonFilename}>
                                            Xem hóa đơn
                                        </a>
                                    </td>
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <button
                                                onClick={() => handleLoadForEditing(entry.id)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors text-lg"
                                                title="Sửa lại"
                                                disabled={isLoadingData}
                                            >
                                                ✏️
                                            </button>
                                            {isAdmin && (
                                                <button onClick={() => handleCompleteClick(entry.id)} disabled={isUploading || isLoadingData} className="px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition-colors disabled:bg-gray-400" title="Hoàn thành thanh toán và tải lên UNC">
                                                    Hoàn thành
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {entries.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có dữ liệu nào.</p>}
            </div>
            
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Danh sách đã thanh toán ({completedEntries.length} mục)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 font-semibold">Mã Line</th>
                                <th className="p-2 font-semibold">MBL</th>
                                <th className="p-2 font-semibold">Số tiền</th>
                                <th className="p-2 font-semibold">UNC</th>
                                <th className="p-2 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completedEntries.map((entry) => (
                                <tr key={entry.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 whitespace-nowrap">{entry.maLine}</td>
                                    <td className="p-2 whitespace-nowrap">{entry.mbl || '-'}</td>
                                    <td className="p-2 whitespace-nowrap">{typeof entry.soTien === 'number' ? entry.soTien.toLocaleString('en-US') : entry.soTien}</td>
                                    <td className="p-2 whitespace-nowrap">
                                        <a href={entry.hoaDonUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={entry.hoaDonFilename}>
                                            Xem UNC
                                        </a>
                                    </td>
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            {(isAdmin || isDocument) && (
                                                <button
                                                    onClick={() => handleDownloadUnc(entry)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors text-lg"
                                                    title="Tải UNC về máy"
                                                >
                                                    ⬇️
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteCompleted(entry)}
                                                    className="text-red-600 hover:text-red-800 transition-colors text-lg"
                                                    title="Xóa vĩnh viễn"
                                                    disabled={isLoadingData}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {completedEntries.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có dữ liệu nào.</p>}
            </div>
        </div>
    );
};

export default MblPaymentContent;
