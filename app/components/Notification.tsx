'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiBell } from 'react-icons/fi';

interface NotificationItem {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  hotelBooking?: { id: number };
  flightBooking?: { id: number };
}

export default function Notification() {
  const { accessToken, userId } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }

    const fetchNotifications = async () => {
      try {
        // Fetch unread count
        const countRes = await fetch(`/api/notifications/unread-count?userId=${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (countRes.ok) {
          const countData = await countRes.json();
          setUnreadCount(countData.unreadCount);
        } else {
          console.error('Failed to fetch unread count:', await countRes.text());
        }

        // Fetch all notifications
        const notificationsRes = await fetch(`/api/notifications?userId=${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json();
          setNotifications(notificationsData);
        } else {
          console.error('Failed to fetch notifications:', await notificationsRes.text());
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [accessToken, userId, router]);

  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read?userId=${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        // Remove the notification from the list instead of just marking it as read
        setNotifications(notifications.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1)); // Decrease count, ensure no negative
      } else {
        console.error('Failed to mark notification as read:', await res.text());
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="notification-container">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="notification-button flex items-center gap-2 relative"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      {showNotifications && (
        <div className="notification-list">
          {notifications.length === 0 ? (
            <p className="text-[var(--text-dark)] dark:text-[var(--text-light)] p-2">
              You're all caught up!
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                onClick={() => !n.isRead && markAsRead(n.id)}
              >
                <p>{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}