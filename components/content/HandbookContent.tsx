
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
    <div className="space-y-4">
      <p>Tài khoản nhận cược, tài khoản nhận thanh toán LCC như dưới đây, khách hàng vui lòng tách riêng LCC và cược container, khách hàng chỉ thanh toán theo tài khoản này và không thanh toán theo tài khoản trên hóa đơn.</p>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p><b>Company Name: <span className="text-[#170080]">CÔNG TY TNHH TIẾP VẬN VÀ VẬN TẢI QUỐC TẾ LONG HOÀNG</span></b></p>
        <p><b>Account NO.: <span className="text-[#170080]">345673979999</span></b></p>
        <p><b>Bank: <span className="text-[#170080]">MB BANK CHI NHÁNH HCM</span></b></p>
      </div>
      <iframe src="https://drive.google.com/file/d/1BfTzkRviMYZbTW-DUmXkd8yrLkQzii__/preview" className="w-full h-96 rounded-lg border"></iframe>
      <div>
        <button onClick={downloadBank} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition mr-4">
          ⬇ Tải xuống file
        </button>
      </div>
    </div>
  );
};

export default HandbookContent;