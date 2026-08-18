import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { slugify } from '../lib/utils';
import './CreateCommunityPage.css';

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    privacy_type: 'public',
    cover_image: ''
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
        if (data && data.length > 0) {
          setCategories(data);
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      } catch (err) {
        console.error('Fetch categories error:', err);
      }
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Davra yaratish uchun avval tizimga kiring', 'warning');
      loginWithGoogle();
      return;
    }

    if (!formData.name.trim()) {
      showToast("Davra nomini kiritish shart", 'error');
      return;
    }

    setLoading(true);
    try {
      const generatedSlug = `${slugify(formData.name)}-${Math.random().toString(36).substring(2, 6)}`;

      const { data: newCircle, error } = await supabase
        .from('circles')
        .insert({
          name: formData.name.trim(),
          slug: generatedSlug,
          description: formData.description.trim(),
          category_id: formData.category_id || null,
          privacy_type: formData.privacy_type,
          cover_image: formData.cover_image.trim() || null,
          creator_id: user.id,
          member_count: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner member in circle_members
      await supabase.from('circle_members').insert({
        circle_id: newCircle.id,
        user_id: user.id,
        role: 'owner'
      });

      showToast("Davra muvaffaqiyatli yaratildi!", 'success');
      navigate(`/communities/${newCircle.slug || newCircle.id}`);
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container create-community-page page-enter">
      <div className="form-card card-glass">
        <div className="form-header">
          <span className="badge badge-accent mb-2">🚀 Yangi Hamjamiyat</span>
          <h1>Yangi davra yaratish</h1>
          <p className="form-subtitle">
            O'z manfaatlaringiz va g'oyalaringiz atrofida fikrdoshlarni bir joyga to'plang.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label className="form-label">Davra nomi *</label>
            <input 
              type="text" 
              className="input form-control" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Masalan: Samarqand Startaplari"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tavsif</label>
            <textarea 
              className="input form-control" 
              rows="4"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Davra maqsadi, kimlar uchun ekanligi haqida qisqacha ma'lumot..."
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Kategoriya</label>
            <select 
              className="input form-control"
              value={formData.category_id}
              onChange={e => setFormData({...formData, category_id: e.target.value})}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon || '🏷️'} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Muqova rasm URL (ixtiyoriy)</label>
            <input 
              type="url" 
              className="input form-control" 
              value={formData.cover_image}
              onChange={e => setFormData({...formData, cover_image: e.target.value})}
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ko'rinishi (Maxfiylik)</label>
            <select 
              className="input form-control"
              value={formData.privacy_type}
              onChange={e => setFormData({...formData, privacy_type: e.target.value})}
            >
              <option value="public">🌐 Ochiq (hamma ko'ra oladi va qo'shiladi)</option>
              <option value="private">🔒 Yopiq (faqat a'zolar ko'radi)</option>
              <option value="invite_only">🔗 Faqat taklif bilan</option>
            </select>
          </div>

          <div className="form-actions mt-6">
            <button type="submit" className="btn btn-primary btn-xl w-full" disabled={loading}>
              {loading ? 'Yaratilmoqda...' : 'Davra Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
