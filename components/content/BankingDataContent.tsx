import React, { useState, useEffect } from 'react';
import { BankingData } from '../../types';

const LOCAL_STORAGE_KEY = 'kimberry-banking-data';
const MBBANK_URL = 'https://ebank.mbbank.com.vn/cp/transfer/fast';

interface BankingDataContentProps {
  back: () => void;
}

const initialFormData: Omit<BankingData, 'id'> = {
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    amount: '',
    content: '',
};

const formFields: { name: keyof typeof initialFormData; label: string; type: string; required?: boolean; inputMode?: "decimal" | "text" }[] = [
    { name: "bankName", label: "Tên ngân hàng (*)", type: "text", required: true },
    { name: "accountNumber", label: "Số tài khoản (*)", type: "text", required: true },
    { name: "accountHolder", label: "Tên chủ tài khoản (*)", type: "text", required: true },
    { name: "amount", label: "Số tiền", type: "text", inputMode: "decimal" },
    { name: "content", label: "Nội dung chuyển khoản", type: "text" },
];

const BankingDataContent: React.FC<BankingDataContentProps> = ({ back }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [bankingEntries, setBankingEntries] = useState<BankingData[]>([]);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Load entries from localStorage on initial render
    useEffect(() => {
        try {
            const savedEntries = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedEntries) {
                setBankingEntries(JSON.parse(savedEntries));
            }
        } catch (error) {
            console.error("Failed to load banking data from localStorage", error);
        }
    }, []);

    // Save entries to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bankingEntries));
        } catch (error) {
            console.error("Failed to save banking data to localStorage", error);
        }
    }, [bankingEntries]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue ? parseInt(numericValue, 10) : '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddEntry = () => {
        if (!formData.bankName || !formData.accountNumber || !formData.accountHolder) {
            setStatus({ type: 'error', message: 'Vui lòng điền các trường bắt buộc (*).' });
            return;
        }
        
        const newEntry: BankingData = {
            id: Date.now().toString(),
            ...formData,
        };

        setBankingEntries(prev => [...prev, newEntry]);
        setFormData(initialFormData);
        setStatus({ type: 'success', message: `Đã thêm thông tin cho "${newEntry.accountHolder}".` });
    };

    const handleDeleteEntry = (idToDelete: string) => {
        setBankingEntries(prev => prev.filter(entry => entry.id !== idToDelete));
        setStatus({ type: 'info', message: 'Đã xóa mục.' });
    };

    const handleLoadForEditing = (idToLoad: string) => {
        const entryToLoad = bankingEntries.find(entry => entry.id === idToLoad);
        if (entryToLoad) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...dataToLoad } = entryToLoad;
            setFormData(dataToLoad);
            setBankingEntries(prev => prev.filter(entry => entry.id !== idToLoad));
            setStatus({ type: 'info', message: `Đã tải "${entryToLoad.accountHolder}" lên để chỉnh sửa.` });
        }
    };
    
    const handlePay = (entry: BankingData) => {
        // Copy the most important info first: the account number.
        navigator.clipboard.writeText(entry.accountNumber)
            .then(() => {
                setStatus({ type: 'success', message: `Đã sao chép SỐ TÀI KHOẢN. Dán vào trang thanh toán...` });
                // Then open the banking website.
                window.open(MBBANK_URL, '_blank');
            })
            .catch(err => {
                setStatus({ type: 'error', message: 'Không thể sao chép số tài khoản.' });
                console.error('Clipboard API error:', err);
                // Still open the tab even if copy fails
                window.open(MBBANK_URL, '_blank');
            });
    };

    const statusColor = {
        success: 'text-green-600 bg-green-100 border-green-300',
        error: 'text-red-600 bg-red-100 border-red-300',
        info: 'text-blue-600 bg-blue-100 border-blue-300',
    };

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Mục Nhập Liệu Bank</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formFields.map(field => {
                        const currentValue = formData[field.name];
                        const displayValue = (field.name === 'amount' && typeof currentValue === 'number') 
                            ? (currentValue > 0 ? currentValue.toLocaleString('en-US') : '') 
                            : String(currentValue || '');

                        return (
                            <div key={field.name}>
                                <label htmlFor={field.name} className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
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
                            </div>
                        )
                    })}
                </div>
                <button onClick={handleAddEntry} className="mt-4 px-4 py-2 bg-[#5c9ead] text-white rounded-md hover:bg-[#4a8c99]">
                    ➕ Nhập
                </button>
            </div>

            {status && <div className={`p-3 rounded-md border ${statusColor[status.type]}`}>{status.message}</div>}

            <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Dữ liệu đã lưu ({bankingEntries.length} mục)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 font-semibold">Tên ngân hàng</th>
                                <th className="p-2 font-semibold">Số tài khoản</th>
                                <th className="p-2 font-semibold">Chủ tài khoản</th>
                                <th className="p-2 font-semibold">Số tiền</th>
                                <th className="p-2 font-semibold">Nội dung</th>
                                <th className="p-2 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bankingEntries.map((entry) => (
                                <tr key={entry.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 whitespace-nowrap">{entry.bankName}</td>
                                    <td className="p-2 whitespace-nowrap">{entry.accountNumber}</td>
                                    <td className="p-2 whitespace-nowrap">{entry.accountHolder}</td>
                                    <td className="p-2 whitespace-nowrap">{typeof entry.amount === 'number' ? entry.amount.toLocaleString('en-US') : entry.amount}</td>
                                    <td className="p-2">{entry.content}</td>
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <button onClick={() => handlePay(entry)} className="text-green-500 hover:text-green-700 text-xl" title="Thanh toán (Sao chép STK & Mở trang MBBank)">💳</button>
                                            <button onClick={() => handleLoadForEditing(entry.id)} className="text-blue-500 hover:text-blue-700 text-xl" title="Tải để sửa">✏️</button>
                                            <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-500 hover:text-red-700 text-xl" title="Xóa">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {bankingEntries.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có dữ liệu nào được lưu.</p>}
            </div>
        </div>
    );
};

export default BankingDataContent;