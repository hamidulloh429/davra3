import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import SearchBar from '../../components/SearchBar';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';

export default function AdminCommunitiesPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();

  const [circles, setCircles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [deleteModalCircle, setDeleteModalCircle] = useState(null);
  const [editModalCircle, setEditModalCircle] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    privacy_type: 'public',
  });

  const fetchCircles = async () => {
    try {
      setLoading(true);
      let q = supabase
        .from('circles')
        .select('*, categories(name), profiles!creator_id(full_name)')
        .order('created_at', { ascending: false });

      if (search.trim()) {
        q = q.ilike('name', `%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      setCircles(data || []);

      const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
      if (catData) setCategories(catData);
    } catch (err) {
      showToast(err.message || 'Davralarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, [search]);

  const handleCreateCircle = async (e) => {
    e.preventDefault();
    try {
      const slug = formData.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      const { data, error } = await supabase
        .from('circles')
        .insert({
          name: formData.name.trim(),
          slug,
          description: formData.description.trim(),
          category_id: formData.category_id || null,
          privacy_type: formData.privacy_type,
          creator_id: admin?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin?.id,
        action: 'circle_created',
        target_type: 'circle',
        target_id: data.id,
      });

      showToast('Yangi davra muvaffaqiyatli yaratildi!', 'success');
      setCreateModalOpen(false);
      setFormData({ name: '', description: '', category_id: '', privacy_type: 'public' });
      fetchCircles();
    } catch (err) {
      showToast(err.message || 'Davra yaratishda xatolik', 'error');
    }
  };

  const handleToggleHide = async (circle) => {
    try {
      const { error } = await supabase
        .from('circles')
        .update({ is_hidden: !circle.is_hidden })
        .eq('id', circle.id);

      if (error) throw error;

      showToast(`Davra ${circle.is_hidden ? 'ko\'rsatildi' : 'yashirildi'}`, 'info');
      fetchCircles();
    } catch (err) {
      showToast(err.message || 'Xatolik', 'error');
    }
  };

  const handleDeleteCircle = async () => {
    if (!deleteModalCircle) return;
    try {
      const { error } = await supabase.from('circles').delete().eq('id', deleteModalCircle.id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin?.id,
        action: 'circle_deleted',
        target_type: 'circle',
        target_id: deleteModalCircle.id,
      });

      showToast("Davra o'chirildi", 'info');
      setDeleteModalCircle(null);
      fetchCircles();
    } catch (err) {
      showToast(err.message || "O'chirishda xatolik", 'error');
    }
  };

  return (
    <div className="admin-communities-page">
      <div className="admin-page-header flex justify-between items-center mb-6">
        <div>
          <h1>Davralarni boshqarish</h1>
          <p className="text-muted">Platformadagi barcha jamiyatlar ({circles.length})</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          + Yangi davra yarating
        </button>
      </div>

      <div className="mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Davra nomi bo'yicha qidiruv..." />
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Toifa</th>
                <th>Yaratuvchi</th>
                <th>Maxfiylik</th>
                <th>A'zolar</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">Yuklanmoqda...</td>
                </tr>
              ) : circles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-6">Davralar topilmadi</td>
                </tr>
              ) : (
                circles.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.name}</td>
                    <td><span className="badge badge-primary">{c.categories?.name || 'Umumiy'}</span></td>
                    <td className="text-muted">{c.profiles?.full_name || 'Admin'}</td>
                    <td>
                      <span className={`badge ${c.privacy_type === 'public' ? 'badge-success' : 'badge-warning'}`}>
                        {c.privacy_type === 'public' ? '🌐 Public' : c.privacy_type === 'private' ? '🔒 Private' : '🔗 Invite'}
                      </span>
                    </td>
                    <td className="font-bold">{c.member_count || 0}</td>
                    <td>
                      {c.is_hidden ? (
                        <span className="badge badge-muted">Yashirilgan</span>
                      ) : (
                        <span className="badge badge-success">Faol</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-outline" onClick={() => handleToggleHide(c)}>
                          {c.is_hidden ? '👁️ Ko\'rsatish' : '🙈 Yashirish'}
                        </button>
                        <button className="btn btn-sm btn-ghost text-error" onClick={() => setDeleteModalCircle(c)}>
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

      {/* Create Modal */}
      {createModalOpen && (
        <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Yangi davra yaratish">
          <form onSubmit={handleCreateCircle} className="input-group gap-4">
            <div className="input-group">
              <label className="input-label">Davra Nomi</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Tavsifi</label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Toifa</label>
              <select
                className="input"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Toifani tanlang</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Maxfiylik turi</label>
              <select
                className="input"
                value={formData.privacy_type}
                onChange={(e) => setFormData({ ...formData, privacy_type: e.target.value })}
              >
                <option value="public">🌐 Public (Hamma qo'shila oladi)</option>
                <option value="private">🔒 Private (So'rov orqali)</option>
                <option value="invite_only">🔗 Invite only (Faqat taklifnoma)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-ghost" onClick={() => setCreateModalOpen(false)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">Yaratish</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteModalCircle}
        onClose={() => setDeleteModalCircle(null)}
        onConfirm={handleDeleteCircle}
        title="Davrani o'chirish"
        message={`Haqiqatan ham "${deleteModalCircle?.name}" davrasini va uning barcha xabarlarini butunlay o'chirib tashlamoqchimisiz?`}
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
        variant="danger"
      />
    </div>
  );
}
