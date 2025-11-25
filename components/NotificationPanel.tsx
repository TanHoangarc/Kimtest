import React from 'react';
import { Notification } from '../types';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
}

// A simple utility to format time since the notification was created
const timeSince = (dateString: string): string => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vừa xong";
};

const actionIcons: Record<Notification['action'], string> = {
    'Nộp hồ sơ hoàn cược': '📄',
    'Thêm thanh toán MBL': '💳',
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose }) => {
  return (
    <div className="absolute right-0 mt-2 w-80 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 text-gray-800 z-50">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Thông báo</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className={`p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="text-xl mt-1">{actionIcons[notification.action]}</div>
                <div>
                  <p className="text-xs text-gray-800">
                    <span className="font-bold">{notification.userEmail}</span> đã {notification.action.toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{notification.details}</p>
                  <p className="text-xs text-blue-500 font-semibold mt-1">{timeSince(notification.timestamp)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-sm text-gray-500">Không có thông báo mới.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
