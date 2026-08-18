import { useState, useEffect } from 'react';
import { supabase, getAvatarUrl } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import SearchBar from '../../components/SearchBar';
import FormField from '../../components/FormField';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';
import './AdminUsersPage.css';

export default function AdminUsersPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, blocked

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockModalUser, setBlockModalUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [deleteModalUser, setDeleteModalUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'active') query = query.eq('is_blocked', false);
      if (filter === 'blocked') query = query.eq('is_blocked', true);
      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      showToast(err.message || 'Foydalanuvchilarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, filter]);

  // Block user action
  const handleBlockUser = async () => {
    if (!blockModalUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: true,
          block_reason: blockReason.trim() || 'Admin tomonidan bloklandi',
          blocked_by: admin?.id || null,
          blocked_at: new Date().toISOString(),
        })
        .eq('id', blockModalUser.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin?.id,
        action: 'user_blocked',
        target_type: 'user',
        target_id: blockModalUser.id,
        metadata: { reason: blockReason }
      });

      showToast(`Foydalanuvchi ${blockModalUser.full_name} bloklandi`, 'warning');
      setBlockModalUser(null);
      setBlockReason('');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Bloklashda xatolik', 'error');
    }
  };

  // Unblock user action
  const handleUnblockUser = async (userToUnblock) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: false,
          block_reason: null,
          blocked_by: null,
          blocked_at: null,
        })
        .eq('id', userToUnblock.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin?.id,
        action: 'user_unblocked',
        target_type: 'user',
        target_id: userToUnblock.id
      });

      showToast(`Foydalanuvchi ${userToUnblock.full_name} blokdan chiqarildi`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Blokdan chiqarishda xatolik', 'error');
    }
  };

  // Delete user action
  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteModalUser.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin?.id,
        action: 'user_deleted',
        target_type: 'user',
        target_id: deleteModalUser.id
      });

      showToast(`Foydalanuvchi ${deleteModalUser.full_name} o'chirildi`, 'info');
      setDeleteModalUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || "O'chirishda xatolik", 'error');
    }
  };

  return (
    <div className="admin-users-page page-enter">
      <div className="admin-page-header mb-6">
        <div>
          <h1>Foydalanuvchilarni boshqarish</h1>
          <p className="text-muted">Jami foydalanuvchilar soni: {users.length} nafar</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-controls-bar mb-6 flex justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Ism, username yoki email bo'yicha qidiruv..."
        />

        <div className="filter-buttons flex gap-2">
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('all')}
          >
            Hammasi
          </button>
          <button
            className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('active')}
          >
            Faollar
          </button>
          <button
            className={`btn btn-sm ${filter === 'blocked' ? 'btn-danger' : 'btn-ghost'}`}
            onClick={() => setFilter('blocked')}
          >
            Bloklanganlar
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card card-glass">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Ism</th>
                <th>Username</th>
                <th>Email</th>
                <th>Holat</th>
                <th>Ro'yxatdan o'tgan</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <div className="spinner spinner-sm" style={{ margin: '0 auto' }} />
                    <p className="text-muted text-xs mt-2">Yuklanmoqda...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-6">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <img
                        src={getAvatarUrl(u.avatar_url, u.full_name)}
                        alt={u.full_name}
                        className="avatar avatar-sm"
                      />
                    </td>
                    <td className="font-semibold">{u.full_name}</td>
                    <td className="text-accent font-medium">@{u.username || 'yo\'q'}</td>
                    <td className="text-secondary">{u.email}</td>
                    <td>
                      {u.is_blocked ? (
                        <span className="badge badge-error" title={u.block_reason || 'Bloklangan'}>🚫 Bloklangan</span>
                      ) : (
                        <span className="badge badge-success">✅ Faol</span>
                      )}
                    </td>
                    <td className="text-xs text-secondary">
                      {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td>
                      <div className="action-buttons flex gap-2">
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => setSelectedUser(u)}
                          title="Ko'rish"
                        >
                          👁️
                        </button>

                        {u.is_blocked ? (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleUnblockUser(u)}
                            title="Blokdan chiqarish"
                          >
                            🔓
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setBlockModalUser(u)}
                            title="Bloklash"
                          >
                            🚫
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-ghost text-error"
                          onClick={() => setDeleteModalUser(u)}
                          title="O'chirish"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View User Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="Foydalanuvchi ma'lumotlari"
        >
          <div className="user-detail-modal text-center">
            <img
              src={getAvatarUrl(selectedUser.avatar_url, selectedUser.full_name)}
              alt={selectedUser.full_name}
              className="avatar avatar-xl mb-4"
              style={{ margin: '0 auto' }}
            />
            <h3>{selectedUser.full_name}</h3>
            <p className="text-accent font-semibold mb-4">@{selectedUser.username || 'username_yoq'}</p>

            <div className="text-left bg-surface p-4 rounded-lg mb-4 text-sm">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Bio:</strong> {selectedUser.bio || "Yo'q"}</p>
              <p><strong>Joylashuv:</strong> {selectedUser.location || "Yo'q"}</p>
              <p><strong>Veb-sayt:</strong> {selectedUser.website || "Yo'q"}</p>
              <p><strong>Qo'shilgan vaqti:</strong> {new Date(selectedUser.created_at).toLocaleString('uz-UZ')}</p>
              {selectedUser.is_blocked && (
                <p className="text-error mt-2">
                  <strong>Blok sababi:</strong> {selectedUser.block_reason || "Ko'rsatilmadi"}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Block Reason Modal */}
      {blockModalUser && (
        <Modal
          isOpen={!!blockModalUser}
          onClose={() => setBlockModalUser(null)}
          title={`Foydalanuvchini bloklash: ${blockModalUser.full_name}`}
        >
          <FormField label="Bloklash sababi" required>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Masalan: Qoidalarga zid xabarlar yuborgani uchun..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2 mt-4">
            <button className="btn btn-ghost" onClick={() => setBlockModalUser(null)}>
              Bekor qilish
            </button>
            <button className="btn btn-danger" onClick={handleBlockUser}>
              Bloklashni tasdiqlash
            </button>
          </div>
        </Modal>
      )}

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={!!deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        onConfirm={handleDeleteUser}
        title="Foydalanuvchini o'chirishni tasdiqlaysizmi?"
        message={`Haqiqatan ham ${deleteModalUser?.full_name} profilini o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`}
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
        variant="danger"
      />
    </div>
  );
}
