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
      // Determine user role to show/hide admin features
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

    // --- New Logic for Persistent Badge Count ---
    const updatePersistentBadgeCount = () => {
      try {
        const submissionsRaw = localStorage.getItem(SUBMISSION_STORAGE_KEY);
        const mblPendingRaw = localStorage.getItem(MBL_PENDING_STORAGE_KEY);

        const submissionsCount = submissionsRaw ? JSON.parse(submissionsRaw).length : 0;
        const mblPendingCount = mblPendingRaw ? JSON.parse(mblPendingRaw).length : 0;
        
        setPersistentBadgeCount(submissionsCount + mblPendingCount);
      } catch (error) {
        console.error("Failed to calculate persistent badge count:", error);
        setPersistentBadgeCount(0);
      }
    };

    // Set up notification listener for real-time updates
    const updateNotifications = () => {
      setNotifications(getNotifications());
    };

    updateNotifications(); // Initial load for panel
    updatePersistentBadgeCount(); // Initial calculation for badge

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
    <header className="bg-cover bg-center relative text-white text-center py-10 px-5 z-30">
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('https://picsum.photos/1200/400?image=1043')" }}
      ></div>
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      
      <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
        {isAdmin && (
          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative bg-white/20 text-white hover:bg-white/40 p-2 rounded-full transition-colors duration-300"
              aria-label={`Notifications (${persistentBadgeCount} pending tasks)`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {persistentBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
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
            className="bg-white/20 text-white hover:bg-white/40 font-semibold px-4 py-2 rounded-lg text-sm transition-colors duration-300 backdrop-blur-sm"
          >
            Đăng xuất
          </button>
        )}
      </div>

      <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-shadow">
        Welcome, Kimberryline!
      </h1>
    </header>
  );
};

export default Header;
