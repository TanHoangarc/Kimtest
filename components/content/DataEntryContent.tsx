import React, { useState, useEffect, useRef } from 'react';
import { JobData } from '../../types';

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

const DataEntryContent: React.FC<DataEntryContentProps> = ({ back }) => {
    const [formData, setFormData] = useState<JobData>(initialFormData);
    const [jobEntries, setJobEntries] = useState<JobData[]>([]);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [isJobLoading, setIsJobLoading] = useState(false);
    
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


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'MaKH' || name === 'SoTien') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue === '') {
                 setFormData(prev => ({ ...prev, [name]: '' }));
                 return;
            }
            const formattedValue = parseInt(numericValue, 10).toLocaleString('en-US');
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'NoiDung1' | 'NoiDung2') => {
        const dateValue = e.target.value; // YYYY-MM-DD
        if (!dateValue) return;

        const [year, month, day] = dateValue.split('-');
        const formattedDate = `${day}/${month}/${year}`;

        let message = '';
        if (fieldName === 'NoiDung1') {
            message = `Đã nhận Cược ngày ${formattedDate}`;
        } else if (fieldName === 'NoiDung2') {
            message = `Đã hoàn Cược ngày ${formattedDate}`;
        }

        setFormData(prev => ({ ...prev, [fieldName]: message }));
        
        // Reset the date input value so the same date can be picked again if needed
        e.target.value = '';
    };
    
    const handleLoadJobData = async () => {
        const query = formData.Ma?.trim();
        if (!query) {
            setStatus({ type: 'error', message: 'Vui lòng nhập Mã Job để tải dữ liệu.' });
            return;
        }

        setIsJobLoading(true);
        setStatus({ type: 'info', message: `Đang tải dữ liệu cho Job: ${query}...` });

        try {
            const response = await fetch(`${WEB_APP_URL}?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`Lỗi mạng! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }
            
            const searchResult = Array.isArray(data) ? data[0] : data;

            if (!searchResult || Object.keys(searchResult).length === 0) {
                setStatus({ type: 'error', message: `Không tìm thấy dữ liệu cho mã: ${query}` });
            } else {
                // Populate form with fetched data
                setFormData(prev => ({
                    ...prev, // Keeps Ma from user input
                    Thang: searchResult.Thang || '',
                    MaKH: searchResult.MaKH ? Number(String(searchResult.MaKH).replace(/,/g, '')).toLocaleString('en-US') : '',
                    SoTien: searchResult.SoTien ? Number(String(searchResult.SoTien).replace(/,/g, '')).toLocaleString('en-US') : '',
                    TrangThai: searchResult.TrangThai || '',
                    NoiDung1: searchResult.NoiDung1 || '',
                    NoiDung2: searchResult.NoiDung2 || '',
                }));
                setStatus({ type: 'success', message: `Đã tải thành công dữ liệu cho Job: ${query}` });
            }
        } catch (err) {
            console.error(err);
            const error = err as Error;
            setStatus({ type: 'error', message: `Tải dữ liệu thất bại: ${error.message}` });
        } finally {
            setIsJobLoading(false);
        }
    };
    
    const handleLoadEntryToForm = (indexToLoad: number) => {
        const entry = jobEntries[indexToLoad];
        setFormData(entry);
        setStatus({ type: 'info', message: `Đã tải Job "${entry.Ma}" lên form để chỉnh sửa.` });
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see the form
    };

    const handleAddEntry = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.Ma) {
            setStatus({ type: 'error', message: 'Mã Job là trường bắt buộc.' });
            return;
        }
        setJobEntries(prevEntries => [...prevEntries, formData]);
        setStatus({ type: 'success', message: `Đã thêm Job "${formData.Ma}" vào bảng.` });
        setFormData(initialFormData); // Reset form for next entry
    };
    
    const handleDeleteEntry = (indexToDelete: number) => {
      const entryToDelete = jobEntries[indexToDelete];
      if(window.confirm(`Bạn có chắc chắn muốn xóa Job "${entryToDelete.Ma}"?`)) {
        setJobEntries(prevEntries => prevEntries.filter((_, index) => index !== indexToDelete));
        setStatus({ type: 'info', message: `Đã xóa Job "${entryToDelete.Ma}" khỏi bảng.` });
      }
    };
    
    const handleClearTable = () => {
        if (jobEntries.length > 0 && window.confirm("Bạn có chắc chắn muốn xóa tất cả dữ liệu trong bảng?")) {
            setJobEntries([]);
            setStatus({ type: 'info', message: "Bảng đã được xóa sạch." });
        }
    };

    const handleExport = () => {
        if (jobEntries.length === 0) {
            setStatus({ type: 'error', message: "Không có dữ liệu trong bảng để xuất file Excel." });
            return;
        }

        setStatus({ type: 'info', message: "Đang tạo file Excel..." });

        const exportData = jobEntries.map(entry => ({
            'Tháng': entry.Thang,
            'Mã Job': entry.Ma,
            'Local Charge': Number(String(entry.MaKH).replace(/,/g, '')) || '',
            'Tiền Cược': Number(String(entry.SoTien).replace(/,/g, '')) || '',
            'Nhận Lcc': entry.TrangThai,
            'Nhận Cược': entry.NoiDung1,
            'Hoàn cược': entry.NoiDung2,
        }));

        try {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "JobData");

            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
            XLSX.writeFile(workbook, `Kimberry_Data_${timestamp}.xlsx`);
            
            setStatus({ type: 'success', message: `File Excel đã được tạo và tải xuống thành công!` });

        } catch (error) {
            console.error("Lỗi khi xuất Excel:", error);
            setStatus({ type: 'error', message: "Đã xảy ra lỗi khi tạo file Excel." });
        }
    };

    const formFields = [
        { name: "Thang", label: "Tháng", type: "text" },
        { name: "Ma", label: "Mã Job (*)", type: "text", required: true },
        { name: "MaKH", label: "Local Charge", type: "text", inputMode: "decimal" as const },
        { name: "SoTien", label: "Tiền Cược", type: "text", inputMode: "decimal" as const },
        { name: "TrangThai", label: "Nhận Lcc", type: "text" },
        { name: "NoiDung1", label: "Nhận Cược", type: "text" },
        { name: "NoiDung2", label: "Hoàn cược", type: "text" },
    ];
    
    const statusColor = {
        success: 'text-green-600 bg-green-100 border-green-300',
        error: 'text-red-600 bg-red-100 border-red-300',
        info: 'text-blue-600 bg-blue-100 border-blue-300',
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-bold text-lg text-gray-800">Quy trình nhập liệu mới</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
                    <li>Điền "Tháng" và "Mã Job". Dùng nút <strong>"Tải"</strong> để điền nhanh thông tin nếu Job đã tồn tại.</li>
                    <li>Hoàn thiện các trường thông tin còn lại và nhấn <strong>"Thêm vào Bảng"</strong>.</li>
                    <li>Dữ liệu trong bảng được <strong>tự động lưu</strong>. Dùng nút "Tải" trong bảng để sửa lại thông tin.</li>
                    <li>Khi hoàn tất, nhấn nút <strong>"Xuất ra Excel"</strong> để tải file về máy.</li>
                    <li>Mở Google Sheets, chọn <strong>File &gt; Import</strong> và tải file vừa tạo lên.</li>
                </ol>
            </div>
            
            <form onSubmit={handleAddEntry} className="space-y-4 border-t pt-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formFields.map(field => {
                        if (field.name === 'Ma') {
                            return (
                                 <div key={field.name}>
                                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">{field.label}</label>
                                    <div className="mt-1 flex gap-2">
                                        <input
                                            type={field.type}
                                            id={field.name}
                                            name={field.name}
                                            value={(formData as any)[field.name] ?? ''}
                                            onChange={handleInputChange}
                                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#5c9ead] focus:border-[#5c9ead]"
                                            required={field.required}
                                        />
                                        <button type="button" onClick={handleLoadJobData} disabled={isJobLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 whitespace-nowrap">
                                           {isJobLoading ? 'Đang tải...' : 'Tải'}
                                       </button>
                                    </div>
                                </div>
                            );
                        }
                        if (field.name === 'NoiDung1' || field.name === 'NoiDung2') {
                            return (
                                <div key={field.name}>
                                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">{field.label}</label>
                                    <div className="mt-1 flex gap-2">
                                        <input
                                            type={field.type}
                                            id={field.name}
                                            name={field.name}
                                            value={(formData as any)[field.name] ?? ''}
                                            onChange={handleInputChange}
                                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#5c9ead] focus:border-[#5c9ead]"
                                        />
                                        <div className="relative flex-shrink-0">
                                            <button type="button" className="p-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition pointer-events-none" tabIndex={-1}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H6z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <input
                                                type="date"
                                                onChange={(e) => handleDateChange(e, field.name as 'NoiDung1' | 'NoiDung2')}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                aria-label={`Chọn ngày cho ${field.label}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return (
                             <div key={field.name}>
                                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">{field.label}</label>
                                <input
                                    type={field.type}
                                    id={field.name}
                                    name={field.name}
                                    value={(formData as any)[field.name] ?? ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#5c9ead] focus:border-[#5c9ead]"
                                    inputMode={field.inputMode || 'text'}
                                    required={field.required}
                                />
                            </div>
                        );
                    })}
                </div>

                {status && (
                    <div className={`p-3 rounded-md border ${statusColor[status.type]}`}>
                        <p>{status.message}</p>
                    </div>
                )}
                
                <div className="flex items-center gap-4 pt-2">
                    <button type="submit" disabled={isJobLoading} className="px-6 py-2 bg-[#184d47] text-white rounded-md hover:bg-opacity-80 transition disabled:bg-gray-400">
                        ➕ Thêm vào Bảng
                    </button>
                </div>
            </form>
            
            <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-[#184d47]">
                        Bảng dữ liệu tạm ({jobEntries.length} mục)
                        <span className="text-sm font-normal text-gray-500 ml-2">(Dữ liệu được tự động lưu)</span>
                    </h3>
                     <div className="flex gap-3 items-center flex-wrap">
                        <button onClick={handleClearTable} disabled={jobEntries.length === 0 || isJobLoading} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:bg-gray-400">
                           Xóa Bảng
                       </button>
                       <button onClick={handleExport} disabled={jobEntries.length === 0 || isJobLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400">
                           📥 Xuất ra Excel
                       </button>
                   </div>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Tháng', 'Mã Job', 'Local Charge', 'Tiền Cược', 'Nhận Lcc', 'Nhận Cược', 'Hoàn cược', 'Hành động'].map(h => 
                                <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {jobEntries.length > 0 ? jobEntries.map((entry, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-700">{entry.Thang}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{entry.Ma}</td>
                                    <td className="px-4 py-3 text-gray-700">{entry.MaKH}</td>
                                    <td className="px-4 py-3 text-gray-700">{entry.SoTien}</td>
                                    <td className="px-4 py-3 text-gray-700">{entry.TrangThai}</td>
                                    <td className="px-4 py-3 text-gray-700">{entry.NoiDung1}</td>
                                    <td className="px-4 py-3 text-gray-700">{entry.NoiDung2}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <button onClick={() => handleLoadEntryToForm(index)} className="text-blue-600 hover:text-blue-900 transition-colors mr-3">
                                            Tải
                                        </button>
                                        <button onClick={() => handleDeleteEntry(index)} className="text-red-600 hover:text-red-900 transition-colors">
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-500">Chưa có dữ liệu. Vui lòng nhập thông tin vào form.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataEntryContent;