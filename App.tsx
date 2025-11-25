import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import MainContent from './components/MainContent';
import Contacts from './components/Contacts';
import { ViewType, User } from './types';
import AuthPage from './components/auth/AuthPage';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('default');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const usersRaw = localStorage.getItem('users');
      let users: User[] = [];
      if (usersRaw) {
        const parsedUsers = JSON.parse(usersRaw);
        if (Array.isArray(parsedUsers)) {
          users = parsedUsers;
        }
      }
      let usersUpdated = false;

      // Ensure the admin account exists with the correct role
      const adminEmail = 'tanhoangarc@gmail.com';
      const adminUser = users.find((user) => user.email === adminEmail);
      if (!adminUser) {
        users.push({
          email: adminEmail,
          password: 'Hoang@2609#',
          role: 'Admin',
        });
        usersUpdated = true;
      } else if (adminUser.role !== 'Admin') {
        adminUser.role = 'Admin';
        usersUpdated = true;
      }

      // Ensure the doc account exists with the correct role
      const docEmail = 'doc@kimberry.com';
      const docUser = users.find((user) => user.email === docEmail);
      if (!docUser) {
        users.push({
          email: docEmail,
          password: 'Kimberry@123',
          role: 'Document',
        });
        usersUpdated = true;
      } else if (docUser.role !== 'Document') {
          docUser.role = 'Document';
          usersUpdated = true;
      }
      
      // Assign 'Customer' role to any user without a role
      users.forEach(user => {
          if (!user.role) {
              user.role = 'Customer';
              usersUpdated = true;
          }
      });

      if (usersUpdated) {
        localStorage.setItem('users', JSON.stringify(users));
      }
    } catch (error) {
        console.error("Failed to initialize user data:", error);
        localStorage.removeItem('users');
    }
    
    try {
      const loggedInUser = localStorage.getItem('user');
      if (loggedInUser) {
        JSON.parse(loggedInUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Corrupted logged-in user session, logging out.", error);
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setActiveView('default');
  };

  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="relative min-h-screen font-sans text-gray-100 overflow-x-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop')",
            filter: "brightness(0.7)"
        }}
      ></div>

      {/* Big Typography Background */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[15vw] font-black text-white/5 tracking-widest uppercase whitespace-nowrap" style={{ mixBlendMode: 'overlay' }}>
          KIMBERRY
        </h1>
      </div>

      {/* Top Navigation Bar (Header + Navbar combined visually) */}
      <div className="relative z-50 flex flex-col md:flex-row items-center justify-between px-8 py-6 max-w-[1600px] mx-auto">
        <Header onLogout={handleLogout} />
        <Navbar setActiveView={setActiveView} />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 px-4 py-4 md:px-8 max-w-[1600px] mx-auto pb-20">
        <MainContent activeView={activeView} setActiveView={setActiveView} />
      </main>

      {/* Footer / Contacts */}
      <div className="relative z-10">
        <Contacts />
      </div>
    </div>
  );
};

export default App;