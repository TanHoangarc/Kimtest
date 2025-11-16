import React, { useState, useEffect } from 'react';
import { JobData } from '../../types';
import CalendarPopup from '../CalendarPopup';

// XLSX is globally available from the script tag in index.html
declare const XLSX: any;

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxk6Gw3BlWnhFay3Zacc_NC9ntebz_lELseV0eXocXtS59xUeK781b-B8ZnQ-sT0Oay/exec";
const LOCAL_STORAGE_KEY = 'kimberry-job-entries';

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
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [isJobLoading, setIsJobLoading] = useState(false);
    
    // State for calendar popup
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarTargetField, setCalendarTargetField] = useState<'NoiDung1' | 'NoiDung2' | null>(null);

    // Load entries from localStorage on initial render
    useEffect(() => {
        try {
            const savedEntries = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedEntries) {
                setJobEntries(JSON.parse(savedEntries));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);

    // Save entries to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobEntries));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }, [jobEntries]);

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

    const handleAddJob = () => {
        if (!formData.Ma || formData.Ma.trim() === '') {
            setStatus({ type: 'error', message: 'Mã Job là trường bắt buộc.' });
            return;
        }
        if (jobEntries.some(job => job.Ma?.trim().toLowerCase() === formData.Ma?.trim().toLowerCase())) {
            setStatus({ type: 'error', message: `Mã Job "${formData.Ma}" đã tồn tại trong bảng tạm.` });
            return;
        }
        setJobEntries(prev => [...prev, formData]);
        setFormData(initialFormData);
        setStatus({ type: 'success', message: `Đã thêm Job "${formData.Ma}" vào bảng tạm.` });
    };

    const handleDeleteJob = (maToDelete: string | undefined) => {
        if (!maToDelete) return;
        setJobEntries(prev => prev.filter(job => job.Ma !== maToDelete));
        setStatus({ type: 'info', message: `Đã xóa Job "${maToDelete}" khỏi bảng tạm.` });
    };

    const handleLoadJobForEditing = (maToLoad: string | undefined) => {
        if (!maToLoad) return;
        const jobToLoad = jobEntries.find(job => job.Ma === maToLoad);
        if (jobToLoad) {
            setFormData(jobToLoad); // Load data into the form
            // Remove the job from the temporary list to avoid duplicates after editing
            setJobEntries(prev => prev.filter(job => job.Ma !== maToLoad));
            setStatus({ type: 'info', message: `Đã tải Job "${maToLoad}" lên mục nhập liệu để chỉnh sửa.` });
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
            setStatus({ type: 'success', message: 'Yêu cầu đồng bộ đã được gửi. Dữ liệu sẽ sớm được cập nhật trên Google Sheet.' });
            setJobEntries([]);
        } catch (error) {
            console.error('Sync error:', error);
            setStatus({ type: 'error', message: 'Đồng bộ thất bại. Vui lòng thử lại. Dữ liệu vẫn được lưu tạm thời.' });
        } finally {
            setIsJobLoading(false);
        }
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
    
    const statusColor = {
        success: 'text-green-600 bg-green-100 border-green-300',
        error: 'text-red-600 bg-red-100 border-red-300',
        info: 'text-blue-600 bg-blue-100 border-blue-300',
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
                <button onClick={handleAddJob} className="mt-4 px-4 py-2 bg-[#5c9ead] text-white rounded-md hover:bg-[#4a8c99]">
                    ➕ Thêm vào bảng tạm
                </button>
            </div>

            {status && <div className={`p-3 rounded-md border ${statusColor[status.type]}`}>{status.message}</div>}

            <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Bảng tạm ({jobEntries.length} mục)</h3>
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
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    {formFields.map(f => (
                                        <td key={f.name} className="p-2 whitespace-nowrap">
                                            {typeof job[f.name] === 'number' ? (job[f.name] as number).toLocaleString('en-US') : (job[f.name] || '-')}
                                        </td>
                                    ))}
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <button onClick={() => handleLoadJobForEditing(job.Ma)} className="text-blue-500 hover:text-blue-700" title="Sửa lại mục này">✏️</button>
                                            <button onClick={() => handleDeleteJob(job.Ma)} className="text-red-500 hover:text-red-700" title="Xóa mục này">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {jobEntries.length === 0 && <p className="text-center text-gray-500 py-4">Bảng tạm trống.</p>}
                <div className="flex flex-wrap gap-4 mt-4">
                    <button onClick={handleSync} disabled={isJobLoading || jobEntries.length === 0} className="px-4 py-2 bg-[#184d47] text-white rounded-md hover:bg-opacity-80 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isJobLoading ? 'Đang đồng bộ...' : `☁️ Đồng bộ ${jobEntries.length} mục`}
                    </button>
                    <button onClick={handleDownloadExcel} disabled={jobEntries.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        ⬇️ Tải xuống Excel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataEntryContent;