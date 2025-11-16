
import React, { useState } from 'react';
import { JobData } from '../../types';

interface JobSearchContentProps {
  back: () => void;
}

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxk6Gw3BlWnhFay3Zacc_NC9ntebz_lELseV0eXocXtS59xUeK781b-B8ZnQ-sT0Oay/exec";
const LOCAL_STORAGE_KEY = 'kimberry-job-entries';

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
        // If local storage fails, we proceed to fetch from the sheet.
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          id="searchHBL"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập mã HBL hoặc Job cần tra..."
          className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-[#5c9ead] focus:border-transparent outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          id="searchBtn"
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-[#5c9ead] text-white border-none rounded-md cursor-pointer hover:bg-[#4a8c99] transition disabled:bg-gray-400"
        >
          {isLoading ? '⏳' : '🔍 Tra cứu'}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Số HBL KIMBERRY có dạng KML.... vui lòng nhập đúng định dạng số HBL.
      </p>

      <div id="resultArea" className="mt-4 text-sm">
        {isLoading && <p>⏳ Đang tìm kiếm dữ liệu...</p>}
        {error && <p className="text-red-600 font-semibold">{error}</p>}
        {result && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {Object.entries({
                      "Tháng": result.Thang,
                      "Mã Job/HBL": result.Ma,
                      "Local Charge": result.MaKH,
                      "Tiền Cược": result.SoTien,
                      "Nhận Lcc": result.TrangThai,
                      "Nhận Cược": result.NoiDung1,
                      "Hoàn cược": result.NoiDung2
                  }).map(([key, value]) => (
                      <tr key={key} className="border-b">
                          <td className="p-2 font-bold bg-gray-100 w-1/3">{key}</td>
                          <td className="p-2">
                            {typeof value === 'number' ? value.toLocaleString('en-US') : (value || "-")}
                          </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobSearchContent;