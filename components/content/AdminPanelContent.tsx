import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface AdminPanelContentProps {
  back: () => void;
}

const AdminPanelContent: React.FC<AdminPanelContentProps> = ({ back }) => {
  const [users, setUsers] = useState<User[]>([]);
  const adminEmail = 'tanhoangarc@gmail.com';

  useEffect(() => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(storedUsers);
    } catch (error) {
      console.error("Failed to parse user data in Admin Panel:", error);
      setUsers([]); // Fallback to an empty list on error
    }
  }, []);

  const handleRoleChange = (email: string, newRole: 'Admin' | 'Document' | 'Customer') => {
    const updatedUsers = users.map(user => {
      if (user.email === email) {
        return { ...user, role: newRole };
      }
      return user;
    });
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

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

  const roleStyles: Record<User['role'], string> = {
    Admin: 'bg-green-200 text-green-800',
    Document: 'bg-amber-200 text-amber-800',
    Customer: 'bg-blue-200 text-blue-800',
  };

  return (
    <div className="space-y-4">
      <p>Quản lý người dùng và phân quyền truy cập. Các thay đổi sẽ được áp dụng ngay lập tức.</p>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phân quyền
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.email}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">
                  {user.email}
                  <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${roleStyles[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-middle">
                  {user.email !== adminEmail ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.email, e.target.value as User['role'])}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                    >
                      <option value="Customer">Customer</option>
                      <option value="Document">Document</option>
                      <option value="Admin">Admin</option>
                    </select>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Không thể thay đổi</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-middle">
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
