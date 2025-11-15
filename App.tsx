import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import MainContent from './components/MainContent';
import Contacts from './components/Contacts';
import { ViewType } from './types';
import AuthPage from './components/auth/AuthPage';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('default');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Ensure the admin account exists
    const adminEmail = 'tanhoangarc@gmail.com';
    const usersRaw = localStorage.getItem('users');
    let users = usersRaw ? JSON.parse(usersRaw) : [];

    const adminExists = users.some((user: any) => user.email === adminEmail);

    if (!adminExists) {
      users.push({
        email: adminEmail,
        password: 'Hoang@2609#',
      });
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Check for existing logged-in user session
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    // Reset view to default when logging out
    setActiveView('default');
  };

  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <Header onLogout={handleLogout} />
      <Navbar setActiveView={setActiveView} />
      <main className="px-4 py-8 md:px-8">
        <MainContent activeView={activeView} setActiveView={setActiveView} />
      </main>
      <Contacts />
    </div>
  );
};

export default App;