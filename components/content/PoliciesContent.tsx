
import React from 'react';

interface PoliciesContentProps {
  back: () => void;
}

const PoliciesContent: React.FC<PoliciesContentProps> = ({ back }) => {
  return (
    <div className="space-y-4">
      <ol className="list-decimal list-inside space-y-4">
        <li>
          <b>Đối với hàng nhập về HP:</b> phơi phiếu nâng hạ bản gốc, công văn hoàn cược, UNC cược cont. Khách hàng gửi toàn bộ hồ sơ về địa chỉ văn phòng của KML Hải Phòng như dưới:
          <ul className="list-disc list-inside ml-8 mt-2 bg-gray-50 p-3 rounded-md">
            <li>Tầng 3A phía bên phải tòa nhà tại thửa 17, Khu B1, Lô 7B Lê Hồng Phong, Phường Gia Viên, Thành phố Hải Phòng (tầng 3A tòa nhà Seabank Lê Hồng Phong)</li>
            <li>Tú - 0763395504</li>
          </ul>
        </li>
        <li>
          <b>Đối với các lô hàng về HCM:</b> bản scan công văn hoàn cược, bản scan phiếu nâng/hạ, UNC cược, gửi về địa chỉ email: <span className="font-mono text-blue-600">doc_hph@kimberryline.com</span> và <span className="font-mono text-blue-600">fin_vn@kimberryline.com</span> <i><strong className="text-red-600">(không yêu cầu bản gốc công văn hoàn cược)</strong></i>
        </li>
      </ol>
    </div>
  );
};

export default PoliciesContent;