
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
        success: 'text-green-300 bg-green-500/20 border-green-500/50',
        error: 'text-red-300 bg-red-500/20 border-red-500/50',
        info: 'text-blue-300 bg-blue-500/20 border-blue-500/50',
        warning: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/50',
    };

    return (
        <div className="space-y-8">
            {isCalendarOpen && (
                <CalendarPopup 
                    onSelectDate={handleDateSelect}
                    onClose={() => setIsCalendarOpen(false)}
                />
            )}

            {/* BLOCK 1: FAST PROCESSING */}
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg transition-all hover:bg-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">⚡</span>
                    <h3 className="text-xl font-bold text-green-300">Xử lý dữ liệu nhanh</h3>
                </div>
                <div className="relative">
                    <textarea
                        value={processingText}
                        onChange={(e) => setProcessingText(e.target.value)}
                        placeholder="Dán dữ liệu vào đây (VD: 54,000,000 ... KMLSHA...)"
                        className="w-full p-4 border border-white/20 rounded-xl bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none min-h-[100px] transition-colors"
                    />
                    <div className="absolute bottom-3 right-3">
                        <button 
                            onClick={handleProcessData} 
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm font-semibold"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Xử lý ngay
                        </button>
                    </div>
                </div>
            </div>

            {/* BLOCK 2: DATA ENTRY FORM */}
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg transition-all hover:bg-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">📝</span>
                    <h3 className="text-xl font-bold text-yellow-300">Mục Nhập Liệu</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">{field.label}</label>
                                <div className="flex items-center gap-2 group">
                                    {field.type === 'select' ? (
                                        <div className="relative w-full">
                                            <select
                                                id={field.name}
                                                name={field.name}
                                                value={String(formData[field.name] || '')}
                                                onChange={handleChange}
                                                className="w-full p-3 pl-4 border border-white/20 rounded-xl bg-white/10 text-white focus:ring-2 focus:ring-green-400 outline-none appearance-none cursor-pointer"
                                                style={{ colorScheme: 'dark' }}
                                            >
                                                {field.options?.map(option => (
                                                    <option key={option} value={option} className="bg-gray-800">{option || '--- Chọn tháng ---'}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type}
                                            id={field.name}
                                            name={field.name}
                                            value={displayValue}
                                            onChange={handleChange}
                                            inputMode={field.inputMode}
                                            required={field.required}
                                            placeholder="..."
                                            className="w-full p-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-400 outline-none transition-colors"
                                        />
                                    )}
                                    
                                    {/* Action Buttons for specific fields */}
                                    {field.name === 'Ma' && (
                                        <button
                                            type="button"
                                            onClick={handleLoadFromSheet}
                                            disabled={isSheetLoading}
                                            className="p-3 bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg flex-shrink-0"
                                            title="Tải từ Google Sheet"
                                        >
                                            {isSheetLoading ? '⏳' : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                                        </button>
                                    )}
                                    {field.name === 'TrangThai' && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, TrangThai: 'Đã nhận thanh toán lcc' }))}
                                            className="p-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-lg flex-shrink-0"
                                            title="Điền nhanh: Đã nhận thanh toán lcc"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </button>
                                    )}
                                    {(field.name === 'NoiDung1' || field.name === 'NoiDung2') && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCalendarTargetField(field.name as 'NoiDung1' | 'NoiDung2');
                                                setIsCalendarOpen(true);
                                            }}
                                            className="p-3 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg flex-shrink-0"
                                            title="Chọn ngày"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleAddJob} 
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-[#184d47] to-green-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                        )}
                        Thêm vào bảng tạm
                    </button>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded-xl border backdrop-blur-md shadow-lg flex items-center gap-3 animate-fade-in ${statusColor[status.type as keyof typeof statusColor] || statusColor.info}`}>
                    <span className="text-xl">
                        {status.type === 'success' && '✅'}
                        {status.type === 'error' && '❌'}
                        {status.type === 'info' && 'ℹ️'}
                        {status.type === 'warning' && '⚠️'}
                    </span>
                    <span className="font-medium">{status.message}</span>
                </div>
            )}

            {/* BLOCK 3: TEMP TABLE */}
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl overflow-hidden transition-all hover:bg-white/10">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                         <span className="text-2xl">☁️</span>
                         <h3 className="text-xl font-bold text-blue-300">Bảng tạm Cloud ({jobEntries.length} mục)</h3>
                    </div>
                    <button 
                        onClick={handleRefresh} 
                        disabled={isSaving}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium text-white transition-colors border border-white/20 flex items-center gap-2"
                    >
                        <span className={isSaving ? 'animate-spin' : ''}>🔄</span>
                        Làm mới
                    </button>
                </div>
                
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/10 text-green-300 uppercase text-xs tracking-wider">
                            <tr>
                                {formFields.map(f => <th key={f.name} className="p-4 font-bold border-b border-white/10">{f.label.replace(' (*)', '')}</th>)}
                                <th className="p-4 font-bold text-right border-b border-white/10">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-200">
                            {jobEntries.map((job, index) => (
                                <tr key={job.Ma || index} className="border-b border-white/5 hover:bg-white/10 transition-colors last:border-0">
                                    {formFields.map(f => (
                                        <td key={f.name} className="p-4 whitespace-nowrap font-medium">
                                            {typeof job[f.name] === 'number' ? (job[f.name] as number).toLocaleString('en-US') : (job[f.name] || '-')}
                                        </td>
                                    ))}
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button 
                                                onClick={() => handleLoadJobForEditing(job.Ma)} 
                                                className="p-2 text-blue-400 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
                                                title="Sửa lại mục này"
                                                disabled={isSaving}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteJob(job.Ma)} 
                                                className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                                                title="Xóa mục này"
                                                disabled={isSaving}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {jobEntries.length === 0 && (
                    <div className="text-center py-10 text-gray-500 bg-white/5 border border-dashed border-white/10 rounded-xl mt-4">
                        <p>Bảng tạm hiện đang trống.</p>
                    </div>
                )}
                
                <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-white/10 justify-end">
                    <button
                        onClick={handleSync}
                        disabled={isJobLoading || isChecking || isSaving || jobEntries.length === 0}
                        className="px-5 py-2.5 bg-green-600/80 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-green-500/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                         {isJobLoading ? <span className="animate-spin">⏳</span> : '🚀'}
                         {isJobLoading ? 'Đang đồng bộ...' : `Đồng bộ Sheet`}
                    </button>
                    <button
                        onClick={handleCheckExistingJobs}
                        disabled={isChecking || isJobLoading || isSaving || jobEntries.length === 0}
                        className="px-5 py-2.5 bg-yellow-500/80 hover:bg-yellow-500 text-white rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isChecking ? <span className="animate-spin">⏳</span> : '🔍'}
                        {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra trùng'}
                    </button>
                    <button
                        onClick={handleDownloadExcel}
                        disabled={jobEntries.length === 0 || isChecking || isJobLoading || isSaving}
                        className="px-5 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span>📊</span> Xuất Excel
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default DataEntryContent;
