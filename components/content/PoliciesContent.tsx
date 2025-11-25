
import React from 'react';

interface PoliciesContentProps {
  back: () => void;
}

const PoliciesContent: React.FC<PoliciesContentProps> = ({ back }) => {
  return (
    <div className="space-y-6 text-lg text-gray-100">
      
      {/* KHỐI 1: HẢI PHÒNG */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-colors group">
        <h4 className="text-xl font-bold text-green-300 mb-3 flex items-center gap-2">
          1. Đối với hàng nhập về Hải Phòng (HP)
        </h4>
        <p className="mb-4 text-gray-200">
          Khách hàng vui lòng gửi <b className="text-white">HỒ SƠ GỐC</b> gồm: Phơi phiếu nâng hạ, công văn hoàn cược, UNC cược cont.
        </p>
        
        {/* Box địa chỉ nổi bật */}
        <div className="bg-white/10 p-5 rounded-xl border-l-4 border-green-400">
            <p className="font-semibold text-white mb-2 flex items-start gap-2">
                <span>🏢</span> 
                <span>Tầng 3A (Tòa nhà Seabank), Thửa 17, Khu B1, Lô 7B Lê Hồng Phong, P. Gia Viên, TP. Hải Phòng.</span>
            </p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-base">
                <span className="flex items-center gap-2 text-yellow-200 font-bold">
                    👤 Tú
                </span>
                <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-white">
                    📞 076 339 5504
                </span>
            </div>
        </div>
      </div>

      {/* KHỐI 2: HỒ CHÍ MINH */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-colors">
        <h4 className="text-xl font-bold text-green-300 mb-3 flex items-center gap-2">
          2. Đối với hàng nhập về Hồ Chí Minh (HCM)
        </h4>
        <p className="mb-4 text-gray-200">
          Chỉ cần gửi <b className="text-white">BẢN SCAN</b>: Phiếu nâng/hạ, công văn hoàn cược, UNC cược.
        </p>
        
        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-400/30 text-base">
             <div className="grid md:grid-cols-2 gap-4">
                 <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span className="font-mono text-blue-200">doc_hph@kimberryline.com</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span className="font-mono text-blue-200">fin_vn@kimberryline.com</span>
                 </div>
             </div>
        </div>
        
        <p className="mt-4 text-sm text-red-300 italic flex items-center gap-2">
            <span>⚠️</span>
            <strong>Lưu ý: Không yêu cầu bản gốc công văn hoàn cược đối với HCM.</strong>
        </p>
      </div>

    </div>
  );
};

export default PoliciesContent;
