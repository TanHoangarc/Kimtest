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
        // Clear potentially corrupted data
        localStorage.removeItem('users');
    }
    
    // Check for existing logged-in user session
    try {
      const loggedInUser = localStorage.getItem('user');
      if (loggedInUser) {
        // Validate that the stored user is valid JSON
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
