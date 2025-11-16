
import React, { useState } from 'react';

interface TariffContentProps {
  back: () => void;
}

const TariffTable: React.FC<{ data: string[][] }> = ({ data }) => (
    <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse text-sm text-center">
            <thead>
                <tr className="bg-[#5c9ead] text-white">
                    <th className="p-2 border border-gray-300">Charge Name</th>
                    <th className="p-2 border border-gray-300">Charge Name En</th>
                    <th className="p-2 border border-gray-300">Is Must</th>
                    <th className="p-2 border border-gray-300">Per CNTR / Per BILL</th>
                    <th className="p-2 border border-gray-300">Per Bill</th>
                    <th className="p-2 border border-gray-300">20GP</th>
                    <th className="p-2 border border-gray-300">40GP</th>
                    <th className="p-2 border border-gray-300">40HQ</th>
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="even:bg-gray-100 hover:bg-gray-200 transition-colors">
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="p-2 border border-gray-300">{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const TariffContent: React.FC<TariffContentProps> = ({ back }) => {
    const [port, setPort] = useState<'HCM' | 'HPH' | null>(null);

    const dataHCM = [
        ["DOC", "DOC", "✓", "Bill", "VND 1,150,000", "-", "-", "-"],
        ["DTHC", "DESTINATION THC", "✓", "Container", "-", "VND 3,700,000", "VND 5,500,000", "VND 5,500,000"],
        ["CLEANING", "CLEANING", "✓", "Container", "-", "VND 400,000", "VND 520,000", "VND 520,000"],
        ["EMC", "EMC", "✓", "Container", "-", "VND 770,000", "VND 1,150,000", "VND 1,150,000"],
        ["CIC", "CIC", "✓", "Container", "-", "VND 1,300,000", "VND 2,600,000", "VND 2,600,000"],
    ];
    const dataHPH = [
        ["DOC", "DOC", "✓", "Bill", "VND 1,150,000", "-", "-", "-"],
        ["DTHC", "DESTINATION THC", "✓", "Container", "-", "VND 3,700,000", "VND 5,500,000", "VND 5,500,000"],
        ["CLEANING", "CLEANING", "✓", "Container", "-", "VND 400,000", "VND 520,000", "VND 520,000"],
        ["EMC", "EMC", "✓", "Container", "-", "VND 770,000", "VND 1,150,000", "VND 1,150,000"],
        ["CIC", "CIC", "✓", "Container", "-", "VND 2,500,000", "VND 5,000,000", "VND 5,000,000"],
    ];

    return (
        <div>
            <p>Chọn cảng HCM hoặc HPH để xem bảng cước:</p>
            <div className="flex gap-4 mt-2">
                <button onClick={() => setPort('HCM')} className={`px-4 py-2 rounded-md transition ${port === 'HCM' ? 'bg-[#184d47] text-white' : 'bg-gray-200'}`}>HCM</button>
                <button onClick={() => setPort('HPH')} className={`px-4 py-2 rounded-md transition ${port === 'HPH' ? 'bg-[#184d47] text-white' : 'bg-gray-200'}`}>HPH</button>
            </div>
            {port === 'HCM' && <TariffTable data={dataHCM} />}
            {port === 'HPH' && <TariffTable data={dataHPH} />}
            {port && (
                <div className="mt-6 text-center">
                    <a
                        href="https://www.kimberryline.com/Company_Show/index/import"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                    >
                        Xem thêm chi tiết biểu phí tại trang chủ Kimberryline
                    </a>
                </div>
            )}
        </div>
    );
};

export default TariffContent;