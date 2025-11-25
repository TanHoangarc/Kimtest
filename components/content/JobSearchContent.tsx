
import React, { useState } from 'react';
import { JobData } from '../../types';

interface JobSearchContentProps {
  back: () => void;
}

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxk6Gw3BlWnhFay3Zacc_NC9ntebz_lELseV0eXocXtS59xUeK781b-B8ZnQ-sT0Oay/exec";
const LOCAL_STORAGE_KEY = 'kimberry-job-entries';

// Define Modern Icons
const Icons = {
  Job: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  LocalCharge: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Deposit: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Status: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CalendarIn: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  CalendarOut: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const JobSearchContent: React.FC<JobSearchContentProps> = ({ back }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("⚠️ Vui lòng nhập mã HBL hoặc Job cần tra cứu.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    
    // 1. Check local storage first
    try {
        const localDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localDataRaw) {
            const localJobs: JobData[] = JSON.parse(localDataRaw);
            const foundJob = localJobs.find(job => job.Ma?.trim().toLowerCase() === trimmedQuery.toLowerCase());
            if (foundJob) {
                setResult(foundJob);
                setIsLoading(false);
                return; // Found in local data, so we stop here.
            }
        }
    } catch (e) {
        console.error("Error reading from local storage:", e);
    }


    // 2. If not found locally, fetch from Google Sheet
    try {
      const response = await fetch(`${WEB_APP_URL}?q=${encodeURIComponent(trimmedQuery)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }
      
      const searchResult = Array.isArray(data) ? data[0] : data;
      if (!searchResult || Object.keys(searchResult).length === 0) {
        setError(`❌ Không tìm thấy dữ liệu cho mã: ${trimmedQuery}`);
      } else {
        setResult(searchResult);
      }

    } catch (err) {
      console.error(err);
      setError("❌ Lỗi kết nối hoặc dữ liệu không đọc được từ Google Sheet.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper component for result rows
  const ResultRow = ({ icon, label, value, highlight = false, isStatus = false }: { icon: React.ReactNode, label: string, value: any, highlight?: boolean, isStatus?: boolean }) => {
      const hasValue = value && value !== '-' && value !== 0;
      
      let valueColor = 'text-white';
      if (highlight) valueColor = 'text-green-300 font-bold text-xl'; // Đã đồng bộ size chữ
      if (isStatus && hasValue) valueColor = 'text-yellow-300 font-medium';

      return (
        <div className="flex items-center justify-between p-4 border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
                <span className="text-green-300 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    {icon}
                </span>
                <span className="text-gray-300 font-medium">{label}</span>
            </div>
            <div className={`text-right ${valueColor}`}>
                {typeof value === 'number' ? value.toLocaleString('en-US') : (value || "-")}
            </div>
        </div>
      );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search Bar */}
      <div className="relative mb-8 group">
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-green-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4-4a1 1 0 01-1.414-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
         </div>
         <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập mã HBL hoặc Job (VD: KMLSHA...)"
            className="w-full pl-12 pr-28 py-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all shadow-lg backdrop-blur-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
         />
         <button
            onClick={handleSearch}
            disabled={isLoading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-[#184d47] text-white rounded-full font-bold hover:bg-[#20635b] transition-all disabled:bg-gray-500 disabled:cursor-not-allowed shadow-md"
         >
            {isLoading ? <span className="animate-spin inline-block">⏳</span> : 'Tra cứu'}
         </button>
      </div>

      {/* Helper Text */}
      {!result && !isLoading && !error && (
        <div className="text-center text-gray-400 italic mt-10">
            <p className="mb-2">💡 Số HBL KIMBERRY có dạng KML....</p>
            <p>Vui lòng nhập chính xác để có kết quả tốt nhất.</p>
        </div>
      )}

      {/* Result Area */}
      <div className="space-y-4">
        {isLoading && (
            <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                <p className="text-green-200">Đang tìm kiếm dữ liệu...</p>
            </div>
        )}
        
        {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-xl text-center backdrop-blur-md">
                {error}
            </div>
        )}

        {result && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-white/10 p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-green-300 uppercase tracking-wide">Kết quả chi tiết</h3>
                <span className="text-sm text-gray-400">{result.Thang || 'N/A'}</span>
            </div>
            
            <div className="p-2">
                <ResultRow icon={Icons.Job} label="Mã Job/HBL" value={result.Ma} highlight />
                <ResultRow icon={Icons.LocalCharge} label="Local Charge" value={result.MaKH} highlight />
                <ResultRow icon={Icons.Deposit} label="Tiền Cược" value={result.SoTien} highlight />
                <ResultRow icon={Icons.Status} label="Trạng thái LCC" value={result.TrangThai} isStatus />
                <ResultRow icon={Icons.CalendarIn} label="Nhận Cược" value={result.NoiDung1} isStatus />
                <ResultRow icon={Icons.CalendarOut} label="Hoàn Cược" value={result.NoiDung2} isStatus />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default JobSearchContent;
