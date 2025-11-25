import React, { useState, useEffect } from 'react';
import { getNotifications, markAllAsRead } from '../utils/notifications';
import NotificationPanel from './NotificationPanel';
import { User, Notification } from '../types';

interface HeaderProps {
  onLogout?: () => void;
}

const SUBMISSION_STORAGE_KEY = 'kimberry-refund-submissions';
const MBL_PENDING_STORAGE_KEY = 'kimberry-mbl-payment-data';

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [userRole, setUserRole] = useState<'Admin' | 'Document' | 'Customer' | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [persistentBadgeCount, setPersistentBadgeCount] = useState(0);

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
      console.error("Failed to parse user data in Header:", error);
    }

    const updatePersistentBadgeCount = () => {
      try {
        const submissionsRaw = localStorage.getItem(SUBMISSION_STORAGE_KEY);
        const mblPendingRaw = localStorage.getItem(MBL_PENDING_STORAGE_KEY);
        const submissionsCount = submissionsRaw ? JSON.parse(submissionsRaw).length : 0;
        const mblPendingCount = mblPendingRaw ? JSON.parse(mblPendingRaw).length : 0;
        setPersistentBadgeCount(submissionsCount + mblPendingCount);
      } catch (error) {
        setPersistentBadgeCount(0);
      }
    };

    const updateNotifications = () => {
      setNotifications(getNotifications());
    };

    updateNotifications();
    updatePersistentBadgeCount();

    window.addEventListener('notifications_updated', updateNotifications);
    window.addEventListener('pending_lists_updated', updatePersistentBadgeCount);
    
    return () => {
      window.removeEventListener('notifications_updated', updateNotifications);
      window.removeEventListener('pending_lists_updated', updatePersistentBadgeCount);
    };
  }, []);

  const isAdmin = userRole === 'Admin';
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleBellClick = () => {
    if (!isPanelOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsPanelOpen(prev => !prev);
  };
  
  return (
    <div className="flex items-center justify-between w-full md:w-auto gap-8">
        {/* LOGO AREA */}
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                K
             </div>
             <div>
                 <h1 className="text-2xl font-bold text-white tracking-wider uppercase font-sans">KIMBERRY</h1>
                 <p className="text-xs text-green-300 tracking-widest uppercase">Merchant Line</p>
             </div>
        </div>

        {/* USER CONTROLS (Only visible on mobile here, usually passed to right side) */}
        {/* For desktop, we might want these on the far right, but the parent layout handles that. 
            We just render the buttons here. */}
        <div className="flex items-center gap-4 md:hidden">
             {/* Mobile simplified controls if needed, but we'll stick to one layout for now */}
        </div>
        
        {/* DESKTOP CONTROLS MOVED TO NAVBAR OR KEPT HERE? 
            Let's keep them here as part of the "Header" component which is now the Logo Area + User Area
        */}
         <div className="hidden md:flex items-center gap-4">
             {isAdmin && (
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="relative p-2 text-white/80 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {persistentBadgeCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-black">
                      {persistentBadgeCount}
                    </span>
                  )}
                </button>
                {isPanelOpen && <NotificationPanel notifications={notifications} onClose={() => setIsPanelOpen(false)} />}
              </div>
            )}
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-sm hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Sign out
              </button>
            )}
         </div>
    </div>
  );
};

export default Header;