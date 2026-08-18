import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import useNotifications from '../hooks/useNotifications';
import { timeAgo } from '../lib/utils';
import './NotificationsPage.css';

const NOTIFICATION_ICONS = {
  mention: '💬',
  reply: '↩️',
  circle_invitation: '📨',
  join_request_accepted: '✅',
  admin_announcement: '📢',
  new_activity: '🔔',
};

export default function NotificationsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(profile?.id);
  const [filter, setFilter] = useState('all'); // all, unread

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    showToast('Barcha bildirishnomalar o\'qilgan deb belgilandi', 'success');
  };

  if (!profile) {
    return (
      <div className="notifications-page container">
        <div className="notifications-empty">
          <span className="notifications-empty-icon">🔔</span>
          <h3>Bildirishnomalar</h3>
          <p>Bildirishnomalarni ko'rish uchun tizimga kiring.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page container">
      <div className="notifications-header">
        <div>
          <h1>Bildirishnomalar</h1>
          {unreadCount > 0 && (
            <span className="badge badge-primary">{unreadCount} ta yangi</span>
          )}
        </div>
        <div className="notifications-actions">
          <div className="notifications-filter">
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setFilter('all')}
            >
              Hammasi
            </button>
            <button
              className={`btn btn-sm ${filter === 'unread' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setFilter('unread')}
            >
              O'qilmagan
            </button>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-sm btn-outline" onClick={handleMarkAllRead}>
              Hammasini o'qilgan deb belgilash
            </button>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="notification-skeleton">
              <div className="skeleton-icon" />
              <div className="skeleton-content">
                <div className="skeleton-line" style={{ width: '60%' }} />
                <div className="skeleton-line" style={{ width: '40%' }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="notifications-empty">
            <span className="notifications-empty-icon">📭</span>
            <h3>{filter === 'unread' ? 'O\'qilmagan bildirishnoma yo\'q' : 'Bildirishnomalar yo\'q'}</h3>
            <p>Yangi bildirishnomalar shu yerda paydo bo'ladi.</p>
          </div>
        ) : (
          filtered.map(notification => (
            <button
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <span className="notification-icon">
                {NOTIFICATION_ICONS[notification.type] || '🔔'}
              </span>
              <div className="notification-content">
                <p className="notification-title">{notification.title}</p>
                {notification.body && (
                  <p className="notification-body">{notification.body}</p>
                )}
                <span className="notification-time">{timeAgo(notification.created_at)}</span>
              </div>
              {!notification.is_read && <span className="notification-dot" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
