import React, { useState } from 'react';

interface LoginFormProps {
    onLoginSuccess: () => void;
    switchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, switchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Vui lòng điền cả email và mật khẩu.');
            return;
        }

        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = storedUsers.find((u: any) => u.email === email);

        if (user && user.password === password) {
            // In a real app, you'd get a token from the server.
            // Here, we'll just store the user object to indicate a session.
            localStorage.setItem('user', JSON.stringify({ email: user.email }));
            onLoginSuccess();
        } else {
            setError('Email hoặc mật khẩu không chính xác.');
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full">
            <h2 className="text-2xl font-bold text-center text-[#184d47] mb-6">Đăng nhập</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
                <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#5c9ead] focus:border-[#5c9ead] sm:text-sm"
                        placeholder="you@example.com"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="login-password"
                           className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#5c9ead] focus:border-[#5c9ead] sm:text-sm"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5c9ead] hover:bg-[#4a8c99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5c9ead] transition-colors"
                >
                    Đăng nhập
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <button onClick={switchToRegister} className="font-medium text-[#5c9ead] hover:text-[#4a8c99]">
                    Đăng ký ngay
                </button>
            </p>
        </div>
    );
};

export default LoginForm;
