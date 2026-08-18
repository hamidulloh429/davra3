import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import FormField from '../../components/FormField';
import PasswordStrength from '../../components/PasswordStrength';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { step, error, verifyAdminGoogle, setupCredentials, loginWithCredentials } = useAdminAuth();

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleGoogleSignIn = async () => {
    setLocalError('');
    try {
      const { data, error: gError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin/login`,
        },
      });
      if (gError) throw gError;
    } catch (err) {
      setLocalError(err.message || 'Google autentifikatsiyasida xatolik');
    }
  };

  const handleVerifyCurrentSession = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const res = await verifyAdminGoogle(session.user.email, session.user.id);
      if (res.success && res.step === 'authenticated') {
        navigate('/admin');
      }
    } else {
      setLocalError('Iltimos, avval Google orqali kiring.');
    }
    setLoading(false);
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (passwordInput.length < 8) {
      setLocalError('Parol kamida 8 ta belgidan iborat bo\'lishi kerak.');
      return;
    }
    if (passwordInput !== confirmPassword) {
      setLocalError('Kiritilgan parollar bir-biriga mos kelmadi.');
      return;
    }

    const res = await setupCredentials(loginInput.trim(), passwordInput);
    if (res.success) {
      navigate('/admin');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const res = await loginWithCredentials(loginInput.trim(), passwordInput);
    if (res.success) {
      navigate('/admin');
    }
  };

  return (
    <div className="admin-login-page bg-grid-dark page-enter">
      <div className="admin-login-card card-glass animate-scale-in">
        <div className="admin-brand">
          <span className="brand-logo">DAVRA</span>
          <span className="badge badge-accent">ADMIN PANEL</span>
        </div>

        {(error || localError) && (
          <div className="admin-login-alert animate-slide-down">
            ⚠️ {error || localError}
          </div>
        )}

        {/* STEP 1: Idle / Initial Google Auth */}
        {step === 'idle' && (
          <div className="login-step-content">
            <h2>Admin Kirish</h2>
            <p className="text-muted mb-6">
              1-bosqich: Google accountingiz orqali shaxsingizni tasdiqlang.
            </p>

            <button onClick={handleGoogleSignIn} className="btn btn-primary btn-lg w-full mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google orqali kirish</span>
            </button>

            <button onClick={handleVerifyCurrentSession} className="btn btn-outline w-full" disabled={loading}>
              {loading ? 'Tekshirilmoqda...' : 'Mavjud sessiyani tekshirish'}
            </button>
          </div>
        )}

        {/* STEP 2: First-time Admin Credential Setup */}
        {step === 'setup_credentials' && (
          <form onSubmit={handleSetupSubmit} className="login-step-content text-left">
            <h2>Admin Login & Parol Yarating</h2>
            <p className="text-muted mb-6">
              Bu admin hisobingiz uchun birinchi kirish. Xavfsiz login va parol o'rnating.
            </p>

            <FormField label="Admin Login" required>
              <input
                type="text"
                className="input"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="masalan: admin_jasur"
                required
              />
            </FormField>

            <FormField label="Yangi Parol" required>
              <input
                type="password"
                className="input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
              />
              <PasswordStrength password={passwordInput} />
            </FormField>

            <FormField label="Parolni tasdiqlang" required>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </FormField>

            <button type="submit" className="btn btn-primary btn-lg w-full mt-4">
              Credentials Saqlash & Kirish
            </button>
          </form>
        )}

        {/* STEP 3: 2-Factor Login & Password verification */}
        {step === 'login' && (
          <form onSubmit={handleLoginSubmit} className="login-step-content text-left">
            <h2>2-Bosqichli Admin Kirish</h2>
            <p className="text-muted mb-6">
              Google tasdiqlandi. Admin login va parolingizni kiriting.
            </p>

            <FormField label="Admin Login" required>
              <input
                type="text"
                className="input"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="admin login"
                required
                autoFocus
              />
            </FormField>

            <FormField label="Parol" required>
              <input
                type="password"
                className="input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
              />
            </FormField>

            <button type="submit" className="btn btn-primary btn-lg w-full mt-4">
              Dashboardga Kirish
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
