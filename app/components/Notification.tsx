'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Notification() {
  const { accessToken, userId } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !userId) {
      router.push('/login');
      return;
    }
    const fetchNotifications = async () => {
      const countRes = await fetch(`/api/notifications/unread-count?userId=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const countData = await countRes.json();
      setUnreadCount(countData.unreadCount);

      // Placeholder for full notifications (add endpoint if needed)
      setNotifications([]); // Update if you add GET /api/notifications
    };
    fetchNotifications();
  }, [accessToken, userId, router]);

  return (
    <div className="notification-container">
      <button className="notification-button">
        Notifications {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      {notifications.length > 0 && (
        <ul className="notification-list">
          {notifications.map((n: any) => (
            <li key={n.id} className="notification-item">{n.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}