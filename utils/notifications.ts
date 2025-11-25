import { Notification } from '../types';

const NOTIFICATION_KEY = 'kimberry-notifications';
const MAX_NOTIFICATIONS = 50;

/**
 * Retrieves all notifications from localStorage.
 * @returns An array of Notification objects.
 */
export const getNotifications = (): Notification[] => {
  try {
    const saved = localStorage.getItem(NOTIFICATION_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to parse notifications from localStorage", error);
    return [];
  }
};

/**
 * Adds a new notification to the list and saves it to localStorage.
 * Triggers a custom event to notify the UI of the update.
 * @param data - The core data for the new notification.
 */
export const addNotification = (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  try {
    const notifications = getNotifications();
    const newNotification: Notification = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    // Add the new notification to the beginning and cap the list size
    const updatedNotifications = [newNotification, ...notifications].slice(0, MAX_NOTIFICATIONS);
    
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new CustomEvent('notifications_updated'));
  } catch (error) {
    console.error("Failed to save notification to localStorage", error);
  }
};

/**
 * Marks all notifications as read and saves the changes.
 * Triggers a custom event to notify the UI of the update.
 */
export const markAllAsRead = () => {
  try {
    const notifications = getNotifications();
    if (notifications.some(n => !n.read)) {
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updatedNotifications));
      window.dispatchEvent(new CustomEvent('notifications_updated'));
    }
  } catch (error) {
    console.error("Failed to mark notifications as read", error);
  }
};
