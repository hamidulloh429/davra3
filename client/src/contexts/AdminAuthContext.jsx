import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AdminAuthContext = createContext();

const SUPER_ADMIN_EMAIL = 'hamidulloh429@gmail.com';

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('idle'); // 'idle' | 'google_verify' | 'setup_credentials' | 'login' | 'authenticated'
  const [googleEmail, setGoogleEmail] = useState('');
  const [error, setError] = useState(null);

  // Check saved admin session on mount
  useEffect(() => {
    const saved = localStorage.getItem('davra_admin_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.google_email) {
          setAdmin(parsed);
          setStep('authenticated');
        }
      } catch (e) {
        localStorage.removeItem('davra_admin_session');
      }
    }
    setLoading(false);
  }, []);

  // Step 1: Verify Google Identity against `admins` table
  const verifyAdminGoogle = async (googleUserEmail, googleUserId) => {
    setError(null);
    setLoading(true);
    setGoogleEmail(googleUserEmail);

    try {
      // 1. Check if email exists in `admins` table
      let { data: adminRecord, error: fetchErr } = await supabase
        .from('admins')
        .select('*')
        .eq('google_email', googleUserEmail)
        .single();

      // If initial super admin and not in table, insert it!
      if ((fetchErr || !adminRecord) && googleUserEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        const { data: newSuperAdmin, error: insertErr } = await supabase
          .from('admins')
          .insert({
            google_email: googleUserEmail,
            google_id: googleUserId,
            name: 'Super Admin',
            role: 'super_admin',
            status: 'active'
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        adminRecord = newSuperAdmin;
      }

      if (!adminRecord) {
        setError("Ruxsat berilmadi: Ushbu Google hisobi adminlar ro'yxatida mavjud emas.");
        setStep('idle');
        setLoading(false);
        return { success: false, reason: 'unauthorized' };
      }

      if (adminRecord.status !== 'active') {
        setError("Ruxsat berilmadi: Admin hisobingiz nofaol holatda.");
        setStep('idle');
        setLoading(false);
        return { success: false, reason: 'inactive' };
      }

      // Check if credentials are set
      if (!adminRecord.login || !adminRecord.password_hash) {
        setStep('setup_credentials');
        setLoading(false);
        return { success: true, step: 'setup_credentials', adminRecord };
      } else {
        setStep('login');
        setLoading(false);
        return { success: true, step: 'login', adminRecord };
      }
    } catch (err) {
      console.error('Admin Google Verification Error:', err);
      setError(err.message || 'Admin autentifikatsiyasida xatolik');
      setStep('idle');
      setLoading(false);
      return { success: false, reason: err.message };
    }
  };

  // Step 2: Setup Admin Credentials (first time)
  const setupCredentials = async (login, password) => {
    if (!googleEmail) return { success: false, message: 'Google identifikatsiyasi topilmadi' };
    setError(null);
    setLoading(true);

    try {
      // In production DB trigger/function handles hashing. For now update record directly.
      const { data, error: updateErr } = await supabase
        .from('admins')
        .update({
          login,
          password_hash: password, // Store password (or hashed)
          password_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('google_email', googleEmail)
        .select()
        .single();

      if (updateErr) throw updateErr;

      setAdmin(data);
      localStorage.setItem('davra_admin_session', JSON.stringify(data));
      setStep('authenticated');
      setLoading(false);

      // Audit log
      await supabase.from('audit_logs').insert({
        admin_id: data.id,
        action: 'admin_credentials_created',
        target_type: 'admin',
        target_id: data.id
      });

      return { success: true };
    } catch (err) {
      setError(err.message || "Parol o'rnatishda xatolik");
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  // Step 3: Login with credentials (2-Factor check)
  const loginWithCredentials = async (login, password) => {
    if (!googleEmail) return { success: false, message: 'Google identifikatsiyasi topilmadi' };
    setError(null);
    setLoading(true);

    try {
      const { data: adminRecord, error: fetchErr } = await supabase
        .from('admins')
        .select('*')
        .eq('google_email', googleEmail)
        .eq('login', login)
        .single();

      if (fetchErr || !adminRecord) {
        setError("Login yoki parol noto'g'ri, yoki ushbu Google hisobiga mos kelmadi.");
        setLoading(false);
        return { success: false };
      }

      if (adminRecord.password_hash !== password) {
        setError("Login yoki parol noto'g'ri.");
        setLoading(false);
        return { success: false };
      }

      // Update last login
      await supabase.from('admins').update({ last_login_at: new Date().toISOString() }).eq('id', adminRecord.id);

      setAdmin(adminRecord);
      localStorage.setItem('davra_admin_session', JSON.stringify(adminRecord));
      setStep('authenticated');
      setLoading(false);

      // Audit log
      await supabase.from('audit_logs').insert({
        admin_id: adminRecord.id,
        action: 'admin_login_success',
        target_type: 'admin',
        target_id: adminRecord.id
      });

      return { success: true };
    } catch (err) {
      setError(err.message || 'Login xatoligi');
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  const logoutAdmin = () => {
    setAdmin(null);
    setStep('idle');
    setGoogleEmail('');
    localStorage.removeItem('davra_admin_session');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        step,
        error,
        googleEmail,
        verifyAdminGoogle,
        setupCredentials,
        loginWithCredentials,
        logoutAdmin,
        isAdmin: !!admin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
