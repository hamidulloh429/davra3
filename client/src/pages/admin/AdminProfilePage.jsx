import { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import PasswordStrength from '../../components/PasswordStrength';

export default function AdminProfilePage() {
  const { admin, logoutAdmin } = useAdminAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!admin) return;

    if (admin.password_hash && currentPassword !== admin.password_hash) {
      showToast("Joriy parol noto'g'ri", 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak", 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Kiritilgan parollar bir-biriga mos kelmadi", 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admins')
        .update({
          password_hash: newPassword,
          password_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', admin.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin.id,
        action: 'admin_password_changed',
        target_type: 'admin',
        target_id: admin.id,
      });

      showToast("Admin paroli muvaffaqiyatli o'zgartirildi!", 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || "Parolni o'zgartirishda xatolik", 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-profile-page max-w-xl mx-auto">
      <div className="admin-page-header mb-6">
        <h1>Admin Profil Sozlamalari</h1>
        <p className="text-muted">Shaxsiy admin hisobingiz va xavfsizlik paroli</p>
      </div>

      {/* Admin Info Card */}
      <div className="card p-6 mb-6 text-left">
        <div className="flex items-center gap-4 mb-4">
          <div className="stat-icon-wrapper blue">👤</div>
          <div>
            <h3 className="text-lg font-bold">{admin?.name || admin?.login || 'Admin'}</h3>
            <span className="badge badge-primary">{admin?.role || 'ADMIN'}</span>
          </div>
        </div>

        <div className="text-sm text-muted flex flex-col gap-2">
          <p><strong>Google Email:</strong> {admin?.google_email}</p>
          <p><strong>Login Username:</strong> {admin?.login || 'O\'rnatilmagan'}</p>
          <p><strong>Oxirgi Parol O'zgargan:</strong> {admin?.password_changed_at ? new Date(admin.password_changed_at).toLocaleString('uz-UZ') : 'Hech qachon'}</p>
        </div>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handlePasswordChange} className="card p-6 text-left">
        <h3 className="mb-4">Admin Parolini O'zgartirish</h3>

        {admin?.password_hash && (
          <div className="input-group mb-4">
            <label className="input-label">Joriy Parol</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        )}

        <div className="input-group mb-4">
          <label className="input-label">Yangi Parol</label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <PasswordStrength password={newPassword} />
        </div>

        <div className="input-group mb-6">
          <label className="input-label">Yangi Parolni Tasdiqlang</label>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-between items-center">
          <button type="button" className="btn btn-outline btn-danger" onClick={logoutAdmin}>
            Admin Paneldan Chiqish
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Parolni O\'zgartirish'}
          </button>
        </div>
      </form>
    </div>
  );
}
