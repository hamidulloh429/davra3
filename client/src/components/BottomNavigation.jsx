import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useNotifications from '../hooks/useNotifications';
import './BottomNavigation.css';

export default function BottomNavigation() {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications(profile?.id);

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Bosh sahifa</span>
      </NavLink>

      <NavLink to="/communities" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🌐</span>
        <span className="nav-label">Davralar</span>
      </NavLink>

      <NavLink to="/notifications" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-wrapper">
          <span className="nav-icon">🔔</span>
          {unreadCount > 0 && <span className="nav-unread-dot" />}
        </div>
        <span className="nav-label">Xabarlar</span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profil</span>
      </NavLink>
    </nav>
  );
}
