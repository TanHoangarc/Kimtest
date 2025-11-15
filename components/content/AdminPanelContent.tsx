
import React, { useState, useEffect } from 'react';

interface User {
  email: string;
  password?: string; // password might not always be present or needed
}

interface AdminPanelContentProps {
  back: () => void;
}

const AdminPanelContent: React.FC<AdminPanelContentProps> = ({ back }) => {
  const [users, setUsers] = useState<User[]>([]);
  const adminEmail = 'tanhoangarc@gmail.com';

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
  }, []);

  const handleDeleteUser = (emailToDelete: string) => {
    if (emailToDelete === adminEmail) {
      alert("Không thể xóa tài khoản Admin.");
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${emailToDelete}?`)) {
      const updatedUsers = users.filter(user => user.email !== emailToDelete);
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
  };

  return (
    <div className="space-y-4">
      <p>Đây là danh sách tất cả người dùng đã đăng ký trên hệ thống.</p>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.email}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.email}
                  {user.email === adminEmail && <span className="ml-2 text-xs font-semibold bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Admin</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteUser(user.email)}
                    disabled={user.email === adminEmail}
                    className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p className="text-center text-gray-500 py-4">Không có người dùng nào được tìm thấy.</p>}
    </div>
  );
};

export default AdminPanelContent;
