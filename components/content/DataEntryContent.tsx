
import React, { useState, useEffect } from 'react';
import { JobData } from '../../types';
import CalendarPopup from '../CalendarPopup';

// XLSX is globally available from the script tag in index.html
declare const XLSX: any;

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxk6Gw3BlWnhFay3Zacc_NC9ntebz_lELseV0eXocXtS59xUeK781b-B8ZnQ-sT0Oay/exec";
const STORE_API_ENDPOINT = '/api/store';
const DATA_KEY = 'kimberry_data_entry_staging';
const LOCAL_STORAGE_KEY_LEGACY = 'kimberry-job-entries';

interface DataEntryContentProps {
  back: () => void;
}

const initialFormData: JobData = {
    Thang: '',
    Ma: '',
    MaKH: '', 
    SoTien: '',
    TrangThai: '', 
    NoiDung1: '', 
    NoiDung2: '',
};

const formFields: { name: keyof JobData; label: string; type: string; required?: boolean; inputMode?: "decimal" | "text"; options?: string[] }[] = [
    { name: "Thang", label: "Tháng", type: "select", options: ['', ...Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)] },
    { name: "Ma", label: "Mã Job (*)", type: "text", required: true },
    { name: "MaKH", label: "Local Charge", type: "text", inputMode: "decimal" },
    { name: "SoTien", label: "Tiền Cược", type: "text", inputMode: "decimal" },
    { name: "TrangThai", label: "Nhận Lcc", type: "text" },
    { name: "NoiDung1", label: "Nhận Cược", type: "text" },
    { name: "NoiDung2", label: "Hoàn cược", type: "text" },
];

const DataEntryContent: React.FC<DataEntryContentProps> = ({ back }) => {
    const [formData, setFormData] = useState<JobData>(initialFormData);
    const [jobEntries, setJobEntries] = useState<JobData[]>([]);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
    const [isJobLoading, setIsJobLoading] = useState(false);
    const [isSheetLoading, setIsSheetLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [processingText, setProcessingText] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    
    // State for calendar popup
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarTargetField, setCalendarTargetField] = useState<'NoiDung1' | 'NoiDung2' | null>(null);

    // --- Cloud Storage Helpers ---
    const fetchRemoteData = async (): Promise<JobData[] | null> => {
        try {
            const res = await fetch(`${STORE_API_ENDPOINT}?key=${DATA_KEY}&_t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                return Array.isArray(json.data) ? json.data : [];
            }
            return null;
        } catch (e) {
            console.error("Fetch error:", e);
            return null;
        }
    };

    const saveRemoteData = async (data: JobData[]) => {
        setIsSaving(true);
        try {
            const res = await fetch(`${STORE_API_ENDPOINT}?key=${DATA_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data })
            });
            if (!res.ok) {
                throw new Error(`Lỗi Server: ${res.status}`);
            }
        } catch (e) {
            console.error("Save error:", e);
            throw e;
        } finally {
            setIsSaving(false);
        }
    };

    // Initialization: Load from Cloud + Migrate Local Data
    useEffect(() => {
        const initializeData = async () => {
            setIsSaving(true);
            setStatus({ type: 'info', message: 'Đang tải dữ liệu bảng tạm từ server...' });
            
            try {
                // 1. Load Cloud Data
                let cloudData = await fetchRemoteData() || [];
                
                // 2. Check Local Storage (Legacy Data)
                const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY_LEGACY);
                if (localRaw) {
                    try {
                        const localData: JobData[] = JSON.parse(localRaw);
                        if (localData.length > 0) {
                            // Merge: Add local items to cloud data if they don't exist
                            const mergedData = [...cloudData];
                            let hasChanges = false;
                            
                            localData.forEach(localItem => {
                                if (!mergedData.some(cloudItem => cloudItem.Ma === localItem.Ma)) {
                                    mergedData.push(localItem);
                                    hasChanges = true;
                                }
                            });

                            if (hasChanges) {
                                await saveRemoteData(mergedData);
                                cloudData = mergedData;
                                setStatus({ type: 'success', message: 'Đã đồng bộ dữ liệu cũ từ máy lên server.' });
                            }
                        }
                        // Clear legacy local storage
                        localStorage.removeItem(LOCAL_STORAGE_KEY_LEGACY);
                    } catch (e) {
                        console.error("Migration error:", e);
                    }
                }

                setJobEntries(cloudData);
                if (!status || status.type === 'info') {
                     setStatus(null);
                }
            } catch (error) {
                setStatus({ type: 'error', message: 'Không thể tải dữ liệu. Vui lòng thử lại.' });
            } finally {
                setIsSaving(false);
            }
        };

        initializeData();
    }, []);
    
    const handleRefresh = async () => {
        setIsSaving(true);
        const data = await fetchRemoteData();
        if (data) {
            setJobEntries(data);
            setStatus({ type: 'success', message: 'Dữ liệu đã được làm mới.' });
        } else {
            setStatus({ type: 'error', message: 'Không thể kết nối tới server.' });
        }
        setIsSaving(false);
    };

    const handleLoadFromSheet = async () => {
        const maToLoad = formData.Ma?.trim();
        if (!maToLoad) {
            setStatus({ type: 'error', message: 'Vui lòng nhập Mã Job để tải dữ liệu.' });
            return;
        }

        setIsSheetLoading(true);
        setStatus({ type: 'info', message: `Đang tìm và tải dữ liệu cho Job "${maToLoad}"...` });

        try {
            const jobInTempTable = jobEntries.find(job => job.Ma?.trim().toLowerCase() === maToLoad.toLowerCase());
            if (jobInTempTable) {
                setStatus({ type: 'error', message: `Job "${maToLoad}" đã có trong bảng tạm. Vui lòng tải từ bảng tạm để sửa.` });
                setIsSheetLoading(false);
                return;
            }

            const response = await fetch(`${WEB_APP_URL}?q=${encodeURIComponent(maToLoad)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const searchResult: JobData | null = Array.isArray(data) && data.length > 0 ? data[0] : (data && Object.keys(data).length > 0 ? data : null);

            if (!searchResult) {
                setStatus({ type: 'error', message: `Không tìm thấy dữ liệu cho Job "${maToLoad}" trên Google Sheet.` });
            } else {
                const loadedData = {
                    ...initialFormData,
                    ...searchResult,
                    MaKH: searchResult.MaKH ? Number(String(searchResult.MaKH).replace(/[^0-9]/g, '')) : '',
                    SoTien: searchResult.SoTien ? Number(String(searchResult.SoTien).replace(/[^0-9]/g, '')) : '',
                };
                setFormData(loadedData);
                setStatus({ type: 'success', message: `Đã tải thành công dữ liệu cho Job "${maToLoad}".` });
            }

        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: "Lỗi kết nối hoặc không tìm thấy dữ liệu từ Google Sheet." });
        } finally {
            setIsSheetLoading(false);
        }
    };

    const handleDateSelect = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        if (calendarTargetField) {
            let prefix = '';
            if (calendarTargetField === 'NoiDung1') {
                prefix = 'Đã nhận cược ngày ';
            } else if (calendarTargetField === 'NoiDung2') {
                prefix = 'Đã hoàn cược ngày ';
            }
            
            setFormData(prev => ({ ...prev, [calendarTargetField]: prefix + formattedDate }));
        }

        setIsCalendarOpen(false);
        setCalendarTargetField(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'MaKH' || name === 'SoTien') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue ? parseInt(numericValue, 10) : '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddJob = async () => {
        if (!formData.Ma || formData.Ma.trim() === '') {
            setStatus({ type: 'error', message: 'Mã Job là trường bắt buộc.' });
            return;
        }
        if (jobEntries.some(job => job.Ma?.trim().toLowerCase() === formData.Ma?.trim().toLowerCase())) {
            setStatus({ type: 'error', message: `Mã Job "${formData.Ma}" đã tồn tại trong bảng tạm.` });
            return;
        }
        
        const newEntries = [...jobEntries, formData];
        setJobEntries(newEntries);
        setFormData(initialFormData);
        
        try {
            await saveRemoteData(newEntries);
            setStatus({ type: 'success', message: `Đã lưu Job "${formData.Ma}" vào bảng tạm Server.` });
        } catch (e) {
            setStatus({ type: 'error', message: 'Lỗi lưu dữ liệu lên Server (nhưng đã lưu tạm thời).' });
        }
    };

    const handleDeleteJob = async (maToDelete: string | undefined) => {
        if (!maToDelete) return;
        const newEntries = jobEntries.filter(job => job.Ma !== maToDelete);
        setJobEntries(newEntries);
        
        try {
            await saveRemoteData(newEntries);
            setStatus({ type: 'info', message: `Đã xóa Job "${maToDelete}" khỏi bảng tạm.` });
        } catch (e) {
            setStatus({ type: 'error', message: 'Lỗi khi xóa trên Server.' });
        }
    };

    const handleLoadJobForEditing = async (maToLoad: string | undefined) => {
        if (!maToLoad) return;
        const jobToLoad = jobEntries.find(job => job.Ma === maToLoad);
        if (jobToLoad) {
            setFormData(jobToLoad);
            
            // Remove from list and save to server
            const newEntries = jobEntries.filter(job => job.Ma !== maToLoad);
            setJobEntries(newEntries);
            
            try {
                await saveRemoteData(newEntries);
                setStatus({ type: 'info', message: `Đã tải Job "${maToLoad}" lên để chỉnh sửa.` });
            } catch (e) {
                setStatus({ type: 'warning', message: 'Đã tải để sửa nhưng chưa cập nhật được Server.' });
            }
        }
    };

    const handleSync = async () => {
        if (jobEntries.length === 0) {
            setStatus({ type: 'info', message: 'Không có dữ liệu để đồng bộ.' });
            return;
        }
        setIsJobLoading(true);
        setStatus({ type: 'info', message: `Đang đồng bộ ${jobEntries.length} mục lên Google Sheet...` });

        try {
            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'bulkAdd', data: jobEntries }),
            });
            
            // On success, clear the staging table on both Client and Server
            setJobEntries([]);
            await saveRemoteData([]);
            
            setStatus({ type: 'success', message: 'Yêu cầu đồng bộ đã gửi. Dữ liệu sẽ sớm được cập nhật trên Google Sheet.' });
        } catch (error) {
            console.error('Sync error:', error);
            setStatus({ type: 'error', message: 'Đồng bộ thất bại. Dữ liệu vẫn được giữ lại.' });
        } finally {
            setIsJobLoading(false);
        }
    };
    
    const handleCheckExistingJobs = async () => {
        if (jobEntries.length === 0) {
            setStatus({ type: 'info', message: 'Không có dữ liệu trong bảng tạm để kiểm tra.' });
            return;
        }
        setIsChecking(true);
        setStatus({ type: 'info', message: `Đang kiểm tra ${jobEntries.length} mục tồn tại trên Google Sheet...` });

        const checkJobExists = async (job: JobData): Promise<boolean> => {
            if (!job.Ma || !job.Ma.trim()) return false;
            try {
                const response = await fetch(`${WEB_APP_URL}?q=${encodeURIComponent(job.Ma.trim())}`);
                if (!response.ok) {
                    console.error(`Network error for job ${job.Ma}`);
                    return false;
                }
                const data = await response.json();
                const exists = Array.isArray(data) && data.length > 0;
                return exists;
            } catch (error) {
                console.error(`Error checking job ${job.Ma}:`, error);
                return false;
            }
        };

        const existenceChecks = await Promise.all(jobEntries.map(checkJobExists));
        const jobsToKeep = jobEntries.filter((_, index) => !existenceChecks[index]);
        const numRemoved = jobEntries.length - jobsToKeep.length;

        setJobEntries(jobsToKeep);
        
        if (numRemoved > 0) {
            await saveRemoteData(jobsToKeep);
            setStatus({ type: 'success', message: `Đã xóa ${numRemoved} mục đã tồn tại trên Google Sheet.` });
        } else {
            setStatus({ type: 'info', message: 'Tất cả các mục đều chưa có trên Google Sheet.' });
        }
        setIsChecking(false);
    };

    const handleDownloadExcel = () => {
        if (jobEntries.length === 0) {
            setStatus({ type: 'info', message: 'Không có dữ liệu để tải xuống.' });
            return;
        }
        try {
            const worksheet = XLSX.utils.json_to_sheet(jobEntries);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "JobEntries");
            XLSX.writeFile(workbook, "Kimberry_Job_Entries_Temp.xlsx");
            setStatus({ type: 'success', message: 'Đã tải xuống bảng tạm thành công.' });
        } catch (error) {
            console.error("Excel export error:", error);
            setStatus({ type: 'error', message: 'Không thể xuất file Excel.' });
        }
    };

    const handleProcessData = () => {
        if (!processingText.trim()) {
            setStatus({ type: 'error', message: 'Vui lòng nhập dữ liệu để xử lý.' });
            return;
        }
    
        const updatedData: Partial<JobData> = {};
    
        // 1. Extract Local Charge (first number with commas at the start of the string)
        const chargeMatch = processingText.match(/^(\d{1,3}(,\d{3})*(\.\d+)?)/);
        if (chargeMatch) {
            updatedData.MaKH = chargeMatch[0].replace(/,/g, '');
        }
    
        // 2. Extract Job Code: KMLSHA or KMLTAO, followed by exactly 8 digits.
        const jobPrefixRegex = /(K\s*M\s*L\s*S\s*H\s*A|K\s*M\s*L\s*T\s*A\s*O)/i;
        const jobMatch = processingText.match(jobPrefixRegex);

        if (jobMatch) {
            const jobPrefix = jobMatch[0].replace(/\s/g, '').toUpperCase();
            const startIndex = jobMatch.index! + jobMatch[0].length;
            const restOfString = processingText.substring(startIndex);
            
            let digits = '';
            for (const char of restOfString) {
                if (/\d/.test(char)) {
                    digits += char;
                    if (digits.length === 8) {
                        break;
                    }
                }
            }
            
            if (digits.length > 0) {
                updatedData.Ma = jobPrefix + digits;
            }
        }
        
        // 3. Extract Month from a date in dd/mm/yyyy format
        const dateMatch = processingText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dateMatch && dateMatch[2]) {
            const monthNumber = parseInt(dateMatch[2], 10);
            if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
                updatedData.Thang = `Tháng ${monthNumber}`;
            }
        }
    
        if (Object.keys(updatedData).length > 0) {
            setFormData(prev => ({
                ...prev,
                ...updatedData
            }));
            setStatus({ type: 'success', message: 'Đã xử lý và điền dữ liệu vào mục nhập liệu.' });
        } else {
            setStatus({ type: 'error', message: 'Không thể trích xuất dữ liệu. Vui lòng kiểm tra định dạng văn bản.' });
        }

        setProcessingText('');
    };
    
    const statusColor = {
        success: 'text-green-600 bg-green-100 border-green-300',
        error: 'text-red-600 bg-red-100 border-red-300',
        info: 'text-blue-600 bg-blue-100 border-blue-300',
        warning: 'text-amber-600 bg-amber-100 border-amber-300',
    };

    return (
        <div className="space-y-6">
            {isCalendarOpen && (
                <CalendarPopup 
                    onSelectDate={handleDateSelect}
                    onClose={() => setIsCalendarOpen(false)}
                />
            )}

            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Xử lý dữ liệu nhanh</h3>
                <textarea
                    value={processingText}
                    onChange={(e) => setProcessingText(e.target.value)}
                    placeholder="Dán dữ liệu vào đây, ví dụ: '54,000,000	... bill KMLSHA11060060 ... 18/11/2025'"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#5c9ead] outline-none min-h-[100px]"
                    aria-label="Data processing input"
                />
                <button 
                    onClick={handleProcessData} 
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                    </svg>
                    Xử lý
                </button>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Mục Nhập Liệu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formFields.map(field => {
                        const currentValue = formData[field.name];
                        let displayValue = '';
                        if ((field.name === 'MaKH' || field.name === 'SoTien') && typeof currentValue === 'number') {
                            displayValue = currentValue > 0 ? currentValue.toLocaleString('en-US') : '';
                        } else {
                            displayValue = String(currentValue || '');
                        }

                        return (
                            <div key={field.name}>
                                <label htmlFor={field.name} className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
                                <div className="flex items-center gap-2">
                                    {field.type === 'select' ? (
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={String(formData[field.name] || '')}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-[#5c9ead] outline-none"
                                        >
                                            {field.options?.map(option => (
                                                <option key={option} value={option}>{option || '--- Chọn tháng ---'}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            id={field.name}
                                            name={field.name}
                                            value={displayValue}
                                            onChange={handleChange}
                                            inputMode={field.inputMode}
                                            required={field.required}
                                            placeholder={field.label.replace(' (*)', '') + '...'}
                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#5c9ead] outline-none"
                                        />
                                    )}
                                    {field.name === 'Ma' && (
                                        <button
                                            type="button"
                                            onClick={handleLoadFromSheet}
                                            disabled={isSheetLoading}
                                            className="px-3 py-2 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 transition-colors flex-shrink-0 whitespace-nowrap disabled:bg-gray-400"
                                            title="Tải dữ liệu từ Google Sheet"
                                        >
                                            {isSheetLoading ? '⏳' : 'Tải'}
                                        </button>
                                    )}
                                    {field.name === 'TrangThai' && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, TrangThai: 'Đã nhận thanh toán lcc' }))}
                                            className="px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors flex-shrink-0 whitespace-nowrap"
                                        >
                                            Hoàn thành
                                        </button>
                                    )}
                                    {(field.name === 'NoiDung1' || field.name === 'NoiDung2') && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCalendarTargetField(field.name as 'NoiDung1' | 'NoiDung2');
                                                setIsCalendarOpen(true);
                                            }}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors flex-shrink-0"
                                            aria-label={`Chọn ngày cho ${field.label}`}
                                        >
                                            📅
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <button 
                    onClick={handleAddJob} 
                    disabled={isSaving}
                    className="mt-4 px-4 py-2 bg-[#5c9ead] text-white rounded-md hover:bg-[#4a8c99] disabled:bg-gray-400"
                >
                    {isSaving ? 'Đang lưu...' : '➕ Thêm vào bảng tạm'}
                </button>
            </div>

            {status && <div className={`p-3 rounded-md border ${statusColor[status.type as keyof typeof statusColor] || statusColor.info}`}>{status.message}</div>}

            <div className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">Bảng tạm Cloud ({jobEntries.length} mục)</h3>
                    <button 
                        onClick={handleRefresh} 
                        disabled={isSaving}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                        <span className={isSaving ? 'animate-spin' : ''}>🔄</span> Làm mới dữ liệu
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                {formFields.map(f => <th key={f.name} className="p-2 font-semibold">{f.label.replace(' (*)', '')}</th>)}
                                <th className="p-2 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobEntries.map((job, index) => (
                                <tr key={job.Ma || index} className="border-b hover:bg-gray-50">
                                    {formFields.map(f => (
                                        <td key={f.name} className="p-2 whitespace-nowrap">
                                            {typeof job[f.name] === 'number' ? (job[f.name] as number).toLocaleString('en-US') : (job[f.name] || '-')}
                                        </td>
                                    ))}
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <button 
                                                onClick={() => handleLoadJobForEditing(job.Ma)} 
                                                className="text-blue-500 hover:text-blue-700 disabled:text-gray-300" 
                                                title="Sửa lại mục này"
                                                disabled={isSaving}
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteJob(job.Ma)} 
                                                className="text-red-500 hover:text-red-700 disabled:text-gray-300" 
                                                title="Xóa mục này"
                                                disabled={isSaving}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {jobEntries.length === 0 && <p className="text-center text-gray-500 py-4">Bảng tạm trống.</p>}
                
                <div className="flex flex-wrap gap-4 mt-4 border-t pt-4">
                    <button
                        onClick={handleSync}
                        disabled={isJobLoading || isChecking || isSaving || jobEntries.length === 0}
                        className="px-4 py-2 bg-[#184d47] text-white rounded-md hover:bg-opacity-80 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isJobLoading ? 'Đang đồng bộ...' : `☁️ Đồng bộ ${jobEntries.length} mục`}
                    </button>
                    <button
                        onClick={handleCheckExistingJobs}
                        disabled={isChecking || isJobLoading || isSaving || jobEntries.length === 0}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isChecking ? 'Đang kiểm tra...' : '🔍 Kiểm tra'}
                    </button>
                    <button
                        onClick={handleDownloadExcel}
                        disabled={jobEntries.length === 0 || isChecking || isJobLoading || isSaving}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        ⬇️ Tải xuống Excel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataEntryContent;
