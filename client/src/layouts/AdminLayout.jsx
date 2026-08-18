import { useState } from 'react';
import { NavLink, Outlet, Navigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import './AdminLayout.css';

export default function AdminLayout() {
  const { admin, loading, logoutAdmin } = useAdminAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="spinner spinner-lg" />
        <p>Admin paneli yuklanmoqda...</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navLinks = [
    { to: '/admin', label: 'Boshqaruv paneli', icon: '📊', end: true },
    { to: '/admin/users', label: 'Foydalanuvchilar', icon: '👥' },
    { to: '/admin/communities', label: 'Davralar', icon: '🌐' },
    { to: '/admin/admins', label: 'Adminlar', icon: '👤' },
    { to: '/admin/reports', label: 'Hisobotlar', icon: '📋' },
    { to: '/admin/media', label: 'Media', icon: '🖼️' },
    { to: '/admin/settings', label: 'Sayt sozlamalari', icon: '⚙️' },
    { to: '/admin/audit-logs', label: 'Audit Log', icon: '📜' },
    { to: '/admin/profile', label: 'Admin Profil', icon: '🔒' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileDrawerOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-title">DAVRA</span>
          <span className="badge badge-accent">ADMIN</span>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span className="link-icon">{link.icon}</span>
              <span className="link-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="btn btn-ghost btn-sm w-full text-left" style={{ color: 'rgba(255,255,255,0.7)' }}>
            ← Saytga qaytish
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        <header className="admin-header">
          <button className="mobile-toggle-btn" onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}>
            ☰
          </button>

          <div className="admin-header-user">
            <span className="admin-name">{admin.name || admin.login || admin.google_email}</span>
            <span className="badge badge-primary">{admin.role || 'ADMIN'}</span>
            <button className="btn btn-sm btn-ghost" onClick={logoutAdmin} title="Chiqish">
              🚪 Chiqish
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {mobileDrawerOpen && (
        <div className="admin-overlay" onClick={() => setMobileDrawerOpen(false)} />
      )}
    </div>
  );
}
