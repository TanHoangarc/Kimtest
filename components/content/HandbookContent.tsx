
import React from 'react';

interface HandbookContentProps {
  back: () => void;
}

const HandbookContent: React.FC<HandbookContentProps> = ({ back }) => {
  const downloadBank = () => {
    const fileId = "1BfTzkRviMYZbTW-DUmXkd8yrLkQzii__";
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    window.open(downloadUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <p className="text-lg leading-relaxed text-gray-100">
        Tài khoản nhận cược, tài khoản nhận thanh toán LCC như dưới đây. <br/>
        <span className="text-yellow-200 italic">⚠️ Khách hàng vui lòng tách riêng LCC và cược container, chỉ thanh toán theo tài khoản này và không thanh toán theo tài khoản trên hóa đơn.</span>
      </p>
      
      {/* Sử dụng !text-... để đè lên màu chữ mặc định của giao diện */}
      {/* Cập nhật: Giảm opacity background xuống 70% và thêm backdrop-blur */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-lg !text-gray-900">
        <div className="space-y-4">
            <div>
                <span className="block text-sm font-semibold !text-gray-600 uppercase tracking-wide">Company Name</span>
                <span className="text-xl md:text-2xl font-extrabold !text-[#170080] uppercase block mt-1">
                    CÔNG TY TNHH TIẾP VẬN VÀ VẬN TẢI QUỐC TẾ LONG HOÀNG
                </span>
            </div>
            
            <div className="h-px bg-gray-500/50 w-full my-2"></div>

            <div>
                <span className="block text-sm font-semibold !text-gray-600 uppercase tracking-wide">Account NO.</span>
                <span className="text-3xl md:text-4xl font-black !text-red-600 tracking-wider block mt-1">
                    345673979999
                </span>
            </div>

            <div className="h-px bg-gray-500/50 w-full my-2"></div>

            <div>
                <span className="block text-sm font-semibold !text-gray-600 uppercase tracking-wide">Bank</span>
                <span className="text-xl font-bold !text-[#170080] block mt-1">
                    MB BANK CHI NHÁNH HCM
                </span>
            </div>
        </div>
      </div>
      
      <div className="mt-6">
          <iframe src="https://drive.google.com/file/d/1BfTzkRviMYZbTW-DUmXkd8yrLkQzii__/preview" className="w-full h-96 rounded-xl border border-white/20 shadow-md"></iframe>
      </div>
      
      <div>
        <button onClick={downloadBank} className="bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-500 transition shadow-lg flex items-center gap-2 transform hover:-translate-y-1">
          ⬇ Tải xuống file thông tin
        </button>
      </div>
    </div>
  );
};

export default HandbookContent;