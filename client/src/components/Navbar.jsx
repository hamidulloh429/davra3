import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { supabase, getAvatarUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

export default function Navbar() {
  const { user, profile, loginWithGoogle, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [siteLogo, setSiteLogo] = useState(null);

  useEffect(() => {
    async function fetchSiteLogo() {
      try {
        const { data } = await supabase.from('site_settings').select('logo_url').eq('id', 1).single();
        if (data?.logo_url) {
          setSiteLogo(data.logo_url);
        }
      } catch (err) {
        console.error('Fetch site logo error:', err);
      }
    }
    fetchSiteLogo();
  }, []);

  return (
    <header className="header">
      <div className="header-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo">
          {siteLogo ? (
            <img src={siteLogo} alt="Davra Logo" className="navbar-logo-img" style={{ maxHeight: '36px', objectFit: 'contain' }} />
          ) : (
            <div className="flex items-center gap-1">
              <span className="logo-text" style={{ color: '#ffffff', fontWeight: 900, fontSize: '24px', letterSpacing: '0.05em' }}>DAVRA</span>
              <span className="logo-dot" style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-accent)', borderRadius: '50%' }} />
            </div>
          )}
        </Link>

        {/* Navigation Links */}
        <nav className={`header-nav ${mobileDrawerOpen ? 'open' : ''}`}>
          <NavLink to="/" end onClick={() => setMobileDrawerOpen(false)}>
            Bosh sahifa
          </NavLink>
          <NavLink to="/communities" onClick={() => setMobileDrawerOpen(false)}>
            Davralar
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <>
              <NotificationBell />

              {/* User Dropdown */}
              <div className="user-dropdown-wrapper" style={{ position: 'relative' }}>
                <button
                  className="avatar-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  title="Profil menyusi"
                >
                  <img
                    src={getAvatarUrl(profile?.avatar_url, profile?.full_name || user.email)}
                    alt="Avatar"
                    className="avatar avatar-sm"
                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--color-accent)' }}
                  />
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown-menu card animate-scale-in" style={{ position: 'absolute', top: '100%', right: 0, width: '220px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', zIndex: 200, marginTop: '8px' }}>
                    <div className="dropdown-user-header mb-2">
                      <span className="user-name font-bold block" style={{ color: '#ffffff' }}>{profile?.full_name || 'Foydalanuvchi'}</span>
                      <span className="user-username text-xs" style={{ color: 'var(--color-accent)' }}>@{profile?.username || 'username'}</span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', marginBlock: '8px' }} />

                    <Link to="/profile" className="dropdown-link" style={{ display: 'block', padding: '6px 8px', color: '#ffffff' }} onClick={() => setDropdownOpen(false)}>
                      👤 Profilim
                    </Link>
                    <Link to="/settings" className="dropdown-link" style={{ display: 'block', padding: '6px 8px', color: '#ffffff' }} onClick={() => setDropdownOpen(false)}>
                      ⚙️ Sozlamalar
                    </Link>
                    <Link to="/admin/login" className="dropdown-link" style={{ display: 'block', padding: '6px 8px', color: '#ffffff' }} onClick={() => setDropdownOpen(false)}>
                      🔒 Admin Panel
                    </Link>

                    <div style={{ borderTop: '1px solid var(--color-border)', marginBlock: '8px' }} />

                    <button className="dropdown-link text-error w-full text-left" style={{ display: 'block', padding: '6px 8px', color: '#EF4444' }} onClick={logout}>
                      🚪 Tizimdan chiqish
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={loginWithGoogle} className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Kirish</span>
            </button>
          )}

          {/* Mobile Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
