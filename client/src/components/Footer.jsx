import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Footer.css';

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setSettings(data);
      })
      .catch(() => {});
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-bg bg-grid-dark">
      <div className="container footer-container">
        <div className="footer-grid">
          {/* Col 1 */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-logo">
              <span className="logo-text text-inverse">DAVRA</span>
              <span className="logo-dot" />
            </Link>
            <p className="footer-desc mt-3">
              {settings?.description || "Sizga mos odamlar bilan bir davrada. Hamjamiyatlar, real-time muloqot va networking platformasi."}
            </p>
          </div>

          {/* Col 2 */}
          <div className="footer-col">
            <h4>Navigatsiya</h4>
            <ul className="footer-links mt-3">
              <li><Link to="/">Bosh sahifa</Link></li>
              <li><Link to="/communities">Davralar</Link></li>
              <li><Link to="/profile">Mening Profilim</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="footer-col">
            <h4>Huquqiy</h4>
            <ul className="footer-links mt-3">
              <li><a href={settings?.terms_url || '#'} target="_blank" rel="noreferrer">Foydalanish shartlari</a></li>
              <li><a href={settings?.privacy_url || '#'} target="_blank" rel="noreferrer">Maxfiylik siyosati</a></li>
              <li><a href={settings?.support_url || '#'} target="_blank" rel="noreferrer">Qo'llab-quvvatlash</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="footer-col">
            <h4>Ijtimoiy Tarmoqlar</h4>
            <div className="social-links mt-3 flex gap-3">
              {settings?.telegram_url && (
                <a href={settings.telegram_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-glass">
                  ✈️ Telegram
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-glass">
                  📸 Instagram
                </a>
              )}
            </div>
            {settings?.contact_email && (
              <span className="footer-email mt-4 block text-xs text-muted">
                ✉️ {settings.contact_email}
              </span>
            )}
          </div>
        </div>

        <div className="footer-bottom mt-12 pt-6 text-center text-xs text-muted border-t">
          <p>© {currentYear} Davra Platform. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>
    </footer>
  );
}
