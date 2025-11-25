
import React, { useState } from 'react';

interface TariffContentProps {
  back: () => void;
}

const TariffTable: React.FC<{ data: string[][] }> = ({ data }) => (
    <div className="overflow-x-auto mt-6 rounded-lg shadow-lg">
        <table className="w-full border-collapse text-sm text-center">
            <thead>
                <tr className="bg-[#5c9ead] text-white uppercase tracking-wider">
                    <th className="p-3 border border-white/20">Charge Name</th>
                    <th className="p-3 border border-white/20">Charge Name En</th>
                    <th className="p-3 border border-white/20">Is Must</th>
                    <th className="p-3 border border-white/20">Per CNTR / Per BILL</th>
                    <th className="p-3 border border-white/20">Per Bill</th>
                    <th className="p-3 border border-white/20">20GP</th>
                    <th className="p-3 border border-white/20">40GP</th>
                    <th className="p-3 border border-white/20">40HQ</th>
                </tr>
            </thead>
            <tbody className="text-gray-900 font-medium">
                {data.map((row, rowIndex) => (
                    <tr 
                        key={rowIndex} 
                        className="bg-white/70 hover:bg-white/90 transition-colors border-b border-gray-200/50 backdrop-blur-sm"
                    >
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="p-3 border-r border-gray-200/30 last:border-r-0">{cell}</td>
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
            <p className="mb-4 text-lg">Chọn cảng để xem biểu phí chi tiết:</p>
            <div className="flex flex-wrap gap-4 mt-2">
                <button 
                    onClick={() => setPort('HCM')} 
                    className={`
                        w-40 py-3 rounded-lg font-bold text-lg uppercase tracking-wide transition-all shadow-md transform hover:-translate-y-1
                        ${port === 'HCM' 
                            ? 'bg-[#184d47] text-white ring-2 ring-green-400' 
                            : 'bg-white/20 text-white hover:bg-white/30 border border-white/10'}
                    `}
                >
                    HCM
                </button>
                <button 
                    onClick={() => setPort('HPH')} 
                    className={`
                        w-40 py-3 rounded-lg font-bold text-lg uppercase tracking-wide transition-all shadow-md transform hover:-translate-y-1
                        ${port === 'HPH' 
                            ? 'bg-[#184d47] text-white ring-2 ring-green-400' 
                            : 'bg-white/20 text-white hover:bg-white/30 border border-white/10'}
                    `}
                >
                    HPH
                </button>
            </div>

            {port === 'HCM' && <TariffTable data={dataHCM} />}
            {port === 'HPH' && <TariffTable data={dataHPH} />}
            
            {port && (
                <div className="mt-10 text-center">
                    <a
                        href="https://www.kimberryline.com/Company_Show/index/import"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-yellow-400/50 transition-all transform hover:-translate-y-1"
                    >
                        🔗 Xem chi tiết biểu phí đầy đủ tại Website Kimberry
                    </a>
                </div>
            )}
        </div>
    );
};

export default TariffContent;
