import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import FormField from '../../components/FormField';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';

export default function AdminAdminsPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();

  const [adminsList, setAdminsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalAdmin, setDeleteModalAdmin] = useState(null);

  const [formData, setFormData] = useState({
    google_email: '',
    role: 'admin',
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminsList(data || []);
    } catch (err) {
      showToast(err.message || 'Adminlarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const email = formData.google_email.trim().toLowerCase();
      const { data, error } = await supabase
        .from('admins')
        .insert({
          google_email: email,
          role: formData.role,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin?.id,
        action: 'admin_added',
        target_type: 'admin',
        target_id: data.id,
        metadata: { email, role: formData.role }
      });

      showToast(`Admin ${email} muvaffaqiyatli qo'shildi!`, 'success');
      setCreateModalOpen(false);
      setFormData({ google_email: '', role: 'admin' });
      fetchAdmins();
    } catch (err) {
      showToast(err.message || 'Admin qo\'shishda xatolik', 'error');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteModalAdmin) return;

    if (adminsList.length <= 1) {
      showToast("Tizimda kamida bitta administrator qolishi shart!", 'error');
      setDeleteModalAdmin(null);
      return;
    }

    if (deleteModalAdmin.id === admin?.id) {
      showToast("O'zingizning admin hisobingizni o'chira olmaysiz!", 'error');
      setDeleteModalAdmin(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', deleteModalAdmin.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin?.id,
        action: 'admin_deleted',
        target_type: 'admin',
        target_id: deleteModalAdmin.id
      });

      showToast("Admin hisobi o'chirildi", 'info');
      setDeleteModalAdmin(null);
      fetchAdmins();
    } catch (err) {
      showToast(err.message || "O'chirishda xatolik", 'error');
    }
  };

  return (
    <div className="admin-admins-page page-enter">
      <div className="admin-page-header flex justify-between items-center mb-6">
        <div>
          <h1>Administratorlar boshqaruvi</h1>
          <p className="text-muted">Google email orqali tayinlangan adminlar ({adminsList.length})</p>
        </div>
        {admin?.role === 'super_admin' && (
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            + Yangi Admin Qo'shish
          </button>
        )}
      </div>

      <div className="card card-glass">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Google Email</th>
                <th>Login Username</th>
                <th>Roli</th>
                <th>Holati</th>
                <th>Qo'shilgan vaqti</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">Yuklanmoqda...</td>
                </tr>
              ) : adminsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-6">Adminlar topilmadi</td>
                </tr>
              ) : (
                adminsList.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold">{a.google_email}</td>
                    <td className="text-accent font-mono">{a.login || 'Hali o\'rnatilmagan'}</td>
                    <td>
                      <span className={`badge ${a.role === 'super_admin' ? 'badge-accent' : 'badge-primary'}`}>
                        {a.role === 'super_admin' ? '👑 SUPER ADMIN' : a.role === 'admin' ? '⚙️ ADMIN' : '🛡️ MODERATOR'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {a.status === 'active' ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="text-xs text-secondary">
                      {new Date(a.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td>
                      {admin?.role === 'super_admin' && a.id !== admin.id && (
                        <button
                          className="btn btn-sm btn-ghost text-error"
                          onClick={() => setDeleteModalAdmin(a)}
                          title="Adminni o'chirish"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {createModalOpen && (
        <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Yangi Admin Biriktirish">
          <form onSubmit={handleAddAdmin} className="text-left">
            <FormField label="Admin Google Emaili" required>
              <input
                type="email"
                className="form-input"
                placeholder="masalan: admin@gmail.com"
                value={formData.google_email}
                onChange={(e) => setFormData({ ...formData, google_email: e.target.value })}
                required
              />
              <span className="text-xs text-secondary mt-1">Faqat ushbu Google account bilan admin panelga kirish ruxsat beriladi.</span>
            </FormField>

            <FormField label="Roli va Huquqlari" required>
              <select
                className="form-input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="admin">ADMIN (Foydalanuvchi, davra va moderatsiya)</option>
                <option value="moderator">MODERATOR (Faqat chat va kontent)</option>
                <option value="super_admin">SUPER ADMIN (To'liq huquq)</option>
              </select>
            </FormField>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="btn btn-ghost" onClick={() => setCreateModalOpen(false)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">Admin Biriktirish</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Admin Confirmation */}
      <ConfirmModal
        isOpen={!!deleteModalAdmin}
        onClose={() => setDeleteModalAdmin(null)}
        onConfirm={handleDeleteAdmin}
        title="Admin huquqini olib tashlash"
        message={`Haqiqatan ham "${deleteModalAdmin?.google_email}" hisobidan adminlik huquqini olib tashlamoqchimisiz?`}
        confirmText="Ha, olib tashlansin"
        cancelText="Bekor qilish"
        variant="danger"
      />
    </div>
  );
}
