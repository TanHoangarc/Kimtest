import React, { useState, useEffect } from 'react';
import { ViewType, User } from '../types';

interface NavbarProps {
  setActiveView: (view: ViewType) => void;
}

const NavLink: React.FC<{ 
  onClick: () => void; 
  children: React.ReactNode, 
  active?: boolean;
}> = ({ onClick, children, active }) => {
    return (
      <button
        onClick={onClick}
        className={`
            text-lg font-medium transition-all duration-300 px-1 py-2 mx-2 border-b-2
            ${active 
                ? 'text-white border-green-400' 
                : 'text-white/70 border-transparent hover:text-white hover:border-white/30'}
        `}
      >
        {children}
      </button>
    );
};

const Navbar: React.FC<NavbarProps> = ({ setActiveView }) => {
  const [userRole, setUserRole] = useState<'Admin' | 'Document' | 'Customer' | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('default');

  useEffect(() => {
    try {
      const userEmailRaw = localStorage.getItem('user');
      const allUsersRaw = localStorage.getItem('users');
      if (userEmailRaw && allUsersRaw) {
        const loggedInUser = JSON.parse(userEmailRaw);
        if (loggedInUser && typeof loggedInUser.email === 'string') {
          const parsedUsers = JSON.parse(allUsersRaw);
          if (Array.isArray(parsedUsers)) {
            const allUsers: User[] = parsedUsers;
            const currentUser = allUsers.find(u => u.email === loggedInUser.email);
            if (currentUser) {
              setUserRole(currentUser.role);
            }
          }
        }
      }
    } catch (error) {
        console.error("Failed to parse user data in Navbar:", error);
    }
  }, []);

  const handleNavClick = (view: ViewType) => {
      setCurrentView(view);
      setActiveView(view);
  }

  const isAdmin = userRole === 'Admin';
  const isDocument = userRole === 'Document';

  return (
    <nav className="flex flex-wrap justify-center md:justify-end items-center mt-4 md:mt-0">
      <NavLink active={currentView === 'default'} onClick={() => handleNavClick('default')}>Home</NavLink>
      <NavLink active={currentView === 'tariff'} onClick={() => handleNavClick('tariff')}>Tariff</NavLink>
      <NavLink active={currentView === 'handbook'} onClick={() => handleNavClick('handbook')}>Account</NavLink>
      <NavLink active={currentView === 'policies'} onClick={() => handleNavClick('policies')}>Refund</NavLink>
      <NavLink active={currentView === 'marketing'} onClick={() => handleNavClick('marketing')}>Lookup</NavLink>
      <NavLink active={currentView === 'submission'} onClick={() => handleNavClick('submission')}>Submit</NavLink>
      
      {(isAdmin || isDocument) && (
        <NavLink active={currentView === 'mblPayment'} onClick={() => handleNavClick('mblPayment')}>Payment</NavLink>
      )}

      {isAdmin && (
        <div className="flex items-center ml-4 pl-4 border-l border-white/20">
            <NavLink active={currentView === 'dataEntry'} onClick={() => handleNavClick('dataEntry')}>Input</NavLink>
            <NavLink active={currentView === 'fileManager'} onClick={() => handleNavClick('fileManager')}>File</NavLink>
            <NavLink active={currentView === 'aiTool'} onClick={() => handleNavClick('aiTool')}>PDF Tool</NavLink>
            <NavLink active={currentView === 'admin'} onClick={() => handleNavClick('admin')}>Admin</NavLink>
        </div>
      )}
    </nav>
  );
};

export default Navbar;