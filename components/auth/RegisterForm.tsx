import React, { useState } from 'react';
import { User } from '../../types';

interface RegisterFormProps {
    onRegisterSuccess: () => void;
    switchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, switchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu không khớp.');
            return;
        }

        const storedUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const userExists = storedUsers.some((u) => u.email === email);

        if (userExists) {
            setError('Email này đã được sử dụng.');
            return;
        }

        // Add new user to our makeshift DB with the default 'Customer' role
        const newUser: User = { email, password, role: 'Customer' };
        storedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(storedUsers));

        // Automatically log in the user after registration
        localStorage.setItem('user', JSON.stringify({ email }));
        onRegisterSuccess();
    };


    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full">
            <h2 className="text-2xl font-bold text-center text-[#184d47] mb-6">Tạo tài khoản</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
                <div>
                    <label htmlFor="register-email"
                           className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#5c9ead] focus:border-[#5c9ead] sm:text-sm"
                        placeholder="you@example.com"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="register-password"
                           className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#5c9ead] focus:border-[#5c9ead] sm:text-sm"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password"
                           className="block text-sm font-medium text-gray-700">Xác nhận Mật khẩu</label>
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#5c9ead] focus:border-[#5c9ead] sm:text-sm"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#184d47] hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#184d47] transition-colors"
                >
                    Đăng ký
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button onClick={switchToLogin} className="font-medium text-[#5c9ead] hover:text-[#4a8c99]">
                    Đăng nhập
                </button>
            </p>
        </div>
    );
};

export default RegisterForm;