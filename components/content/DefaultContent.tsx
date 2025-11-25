
import React from 'react';

interface DefaultContentProps {
  back: () => void;
}

const DefaultContent: React.FC<DefaultContentProps> = () => {
  return (
    <div className="space-y-8 leading-relaxed py-4 text-lg text-gray-100">
      {/* Section 1 */}
      <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors shadow-lg">
        <h4 className="font-bold text-2xl text-green-300 mb-4 drop-shadow-sm">1. Hướng dẫn hàng nhập</h4>
        <p className="font-light">
            Mọi yêu cầu liên quan đến hàng nhập, khách hàng vui lòng <span className="text-white font-semibold">reply all email</span> gửi thông báo hàng đến của KML và không bỏ bất kỳ email nào của KML khỏi email đang làm việc để đảm bảo yêu cầu của khách hàng được gửi đến nhân viên phụ trách.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 items-center text-base">
            <span>Kimberry sử dụng:</span>
            <span className="px-4 py-1 rounded-full border border-yellow-400/30 text-yellow-100 bg-yellow-400/10">Lệnh giấy (HPH)</span>
            <span className="px-4 py-1 rounded-full border border-blue-400/30 text-blue-100 bg-blue-400/10">EDO (HCM)</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
          {/* Section 2 */}
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors shadow-lg flex flex-col justify-center">
            <h4 className="font-bold text-2xl text-green-300 mb-6 border-b border-white/10 pb-2">2. Mức cược container</h4>
            <div className="space-y-6">
                <div>
                    <span className="text-gray-300 block text-base font-semibold mb-1">Hàng nhập về HPH</span> 
                    <div className="flex items-baseline gap-2">
                        <b className="font-bold text-white">3,000,000</b>
                        <span className="text-gray-400">/</span>
                        <b className="font-bold text-white">6,000,000</b>
                        <span className="text-base text-gray-400 ml-1">VND</span>
                    </div>
                    <span className="text-base text-gray-400">(20GP / 40HQ)</span>
                </div>
                
                <div className="h-px bg-white/10 w-full"></div>

                <div>
                    <span className="text-gray-300 block text-base font-semibold mb-1">Hàng nhập về HCM</span> 
                    <div className="flex items-baseline gap-2">
                        <b className="font-bold text-white">1,000,000</b>
                        <span className="text-gray-400">/</span>
                        <b className="font-bold text-white">2,000,000</b>
                        <span className="text-base text-gray-400 ml-1">VND</span>
                    </div>
                    <span className="text-base text-gray-400">(20GP / 40HQ)</span>
                </div>
            </div>
            <p className="mt-6 text-base text-yellow-100 italic bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                💡 Với các lô hàng miễn cược, KML sẽ thông báo trực tiếp trên email gửi AN.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors shadow-lg">
            <h4 className="font-bold text-2xl text-green-300 mb-6 border-b border-white/10 pb-2">3. Lưu ý AN & Hóa đơn</h4>
             <ul className="space-y-4">
                <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Kiểm tra kỹ <b className="text-white font-semibold">LOCAL CHARGE</b> trên AN/HÓA ĐƠN NHÁP.</span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">✕</span>
                    <span>Kimberry không giải quyết hủy hóa đơn sau khi khách đã xác nhận.</span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Kiểm tra kỹ: Số cont, Loại cont, Trọng lượng, Cảng đi/đến...</span>
                </li>
             </ul>
             
             <div className="mt-8 pt-6 border-t border-white/10">
                 <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-3">EMAIL NHẬN HÓA ĐƠN</p>
                 <div className="space-y-2 text-base">
                     <div className="flex items-center gap-3">
                        <span className="text-xl">📧</span>
                        <span className="font-mono text-blue-200">finance@longhoanglogistics.com</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-xl">📧</span>
                        <span className="font-mono text-blue-200">fin_vn@kimberryline.com</span>
                     </div>
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default DefaultContent;
