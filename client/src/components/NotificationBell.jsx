import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useNotifications from '../hooks/useNotifications';
import { timeAgo } from '../lib/utils';
import './NotificationBell.css';

export default function NotificationBell() {
  const { profile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(profile?.id);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!profile) return null;

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button className="bell-btn" onClick={() => setOpen(!open)} title="Bildirishnomalar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown card animate-scale-in">
          <div className="dropdown-header">
            <h4>Bildirishnomalar</h4>
            {unreadCount > 0 && (
              <button className="btn btn-sm btn-ghost text-primary" onClick={markAllAsRead}>
                O'qilgan deb belgilash
              </button>
            )}
          </div>

          <div className="dropdown-list">
            {notifications.length === 0 ? (
              <div className="dropdown-empty text-muted text-xs">
                Bildirishnomalar yo'q
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`dropdown-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <span className="item-title">{n.title}</span>
                  {n.body && <span className="item-body">{n.body}</span>}
                  <span className="item-time">{timeAgo(n.created_at)}</span>
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer">
            <Link to="/notifications" onClick={() => setOpen(false)} className="view-all-link">
              Barcha bildirishnomalarni ko'rish →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
