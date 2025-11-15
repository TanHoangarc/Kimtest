
import React from 'react';

interface DefaultContentProps {
  back: () => void; // Not used here, but keeps component signature consistent
}

const DefaultContent: React.FC<DefaultContentProps> = () => {
  return (
    <div className="space-y-4 text-gray-700 leading-relaxed">
      <div>
        <h4 className="font-bold text-lg text-blue-600">1. Hướng dẫn hàng nhập</h4>
        <p>Mọi yêu cầu liên quan đến hàng nhập, khách hàng vui lòng reply all email gửi thông báo hàng đến của KML và không bỏ bất kỳ email nào của KML khỏi email đang làm việc để đảm bảo yêu cầu của khách hàng được gửi đến nhân viên phụ trách.</p>
        <p>Kimberry sử dụng lệnh giấy đối với hàng nhập về HPH, EDO đối với hàng nhập về HCM.</p>
      </div>
      <div>
        <h4 className="font-bold text-lg text-blue-600">2. Mức cược container:</h4>
        <p><b>Đối với hàng nhập về HPH:</b> 3,000,000VND/6,000,000VND per 20GP/40HQ.</p>
        <p><b>Đối với hàng nhập về HCM:</b> 1,000,000VND/2,000,000VND per 20GP/40HQ.</p>
        <p>Với các lô hàng miễn cược, KML sẽ thông báo trực tiếp trên email gửi AN.</p>
      </div>
      <div>
        <h4 className="font-bold text-lg text-blue-600">3. Lưu ý về AN và Hoá đơn</h4>
        <p>Quý khách vui lòng kiểm tra cẩn thận các phí <b>LOCAL CHARGE</b> trên <b>AN/HÓA ĐƠN NHÁP</b> trước khi báo xuất hóa đơn. KIMBERY sẽ không giải quyết những vấn đề hủy hóa đơn khi đã có sự xác nhận từ khách hàng.</p>
        <p>Vui lòng xem kỹ AN <b>(Số cont // Loại cont // T. Lượng // K. Lượng// cảng đi//cảng đến… )</b> nếu có sai khác, đề nghị khách hàng phản hồi lại bằng cách reply email gửi thông báo hàng đến.</p>
        <p><b>Để nhận hóa đơn thanh toán:</b> Khách hàng reply email Thông báo hàng đến, đính kèm AN + cung cấp thông tin xuất hóa đơn và add các email sau: <b>finance@longhoanglogistics.com; fin_vn@kimberryline.com</b>. Khách hàng xác nhận hóa đơn nháp để bộ phận kế toán gửi hóa đơn chính thức.</p>
      </div>
    </div>
  );
};

export default DefaultContent;
