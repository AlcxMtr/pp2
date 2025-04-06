'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiBell } from 'react-icons/fi';

// Global object to hold the refresh function
const globalNotificationRef = {
  refresh: null as null | (() => void),
};

export const setRefreshNotifications = (fn: null | (() => void) ) => {
  globalNotificationRef.refresh = fn;
};

export const refreshNotificationsGlobally = () => {
  if (globalNotificationRef.refresh) {
    console.log('Refreshing notifications globally');
    globalNotificationRef.refresh();
  }
};

interface NotificationItem {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  hotelBooking?: { id: number };
  flightBooking?: { id: number };
}

export default function Notification() {
  const { accessToken, userId, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const countRes = await fetch(`/api/notifications/unread-count?userId=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unreadCount);
      }

      const notificationsRes = await fetch(`/api/notifications?userId=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    fetchNotifications();

    // Set the global refresh function
    setRefreshNotifications(fetchNotifications);

    return () => {
      setRefreshNotifications(null); // Cleanup on unmount
    };
  }, [router, authLoading]);

  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read?userId=${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="notification-container relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="notification-button flex items-center gap-2 relative text-[var(--text-dark)] dark:text-[var(--text-light)]"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {showNotifications && (
        <div className="notification-list absolute right-0 mt-2 w-80 bg-[var(--card-bg-light)] dark:bg-black rounded-lg shadow-lg p-4 z-10">
          {notifications.length === 0 ? (
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)] p-2">
              You're all caught up!
            </p>
          ) : (
            notifications.map((n, index) => (
              <div key={n.id}>
                <div
                  className={`notification-item relative p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${n.isRead ? 'read' : 'unread'}`}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  <p className="text-[var(--text-dark)] dark:text-[var(--text-light)] pr-6">
                    {n.message}
                  </p>
                  {!n.isRead && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </div>
                {index < notifications.length - 1 && (
                  <hr className="border-t border-gray-200 dark:border-gray-700" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}