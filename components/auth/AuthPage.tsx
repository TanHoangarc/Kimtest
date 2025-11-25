import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthPageProps {
    onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const [view, setView] = useState<'login' | 'register'>('login');

    const switchToRegister = () => setView('register');
    const switchToLogin = () => setView('login');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
             <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-[#184d47]">Kimberry Line</h1>
                <p className="text-gray-600">Chào mừng bạn đến với Kimberryline</p>
            </div>
            <div className="w-full max-w-md">
                {view === 'login' ? (
                    <LoginForm onLoginSuccess={onLoginSuccess} switchToRegister={switchToRegister} />
                ) : (
                    <RegisterForm onRegisterSuccess={onLoginSuccess} switchToLogin={switchToLogin} />
                )}
            </div>
        </div>
    );
};

export default AuthPage;