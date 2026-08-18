import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './CreateCommunityPage.css';

const CATEGORIES = ['Umumiy', 'Texnologiya', "San'at", 'Sport', "Ta'lim", 'Biznes', "Sog'liq", 'Sayohat', 'Musiqa', 'Boshqa'];

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Umumiy',
    visibility: 'public',
    cover_image: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Davra yaratish uchun avval tizimga kiring', 'warning');
      login();
      return;
    }

    if (!formData.name.trim()) {
      showToast("Davra nomini kiritish shart", 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/communities', formData);
      showToast("Davra muvaffaqiyatli yaratildi!", 'success');
      const targetSlug = res.community ? res.community.slug : (res.slug || '');
      navigate(targetSlug ? `/communities/${targetSlug}` : '/communities');
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container create-community-page">
      <div className="form-container">
        <h1>Yangi davra yaratish</h1>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          O'z manfaatlaringiz va g'oyalaringiz atrofida odamlarni birlashtiring.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Davra nomi *</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Masalan: Samarqand Startaplari"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tavsif</label>
            <textarea 
              className="form-control" 
              rows="4"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Davra maqsadi, kimlar uchun ekanligi haqida qisqacha ma'lumot..."
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Kategoriya</label>
            <select 
              className="form-control"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Muqova rasm URL (ixtiyoriy)</label>
            <input 
              type="url" 
              className="form-control" 
              value={formData.cover_image}
              onChange={e => setFormData({...formData, cover_image: e.target.value})}
              placeholder="https://example.com/rasm.jpg"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ko'rinishi</label>
            <select 
              className="form-control"
              value={formData.visibility}
              onChange={e => setFormData({...formData, visibility: e.target.value})}
            >
              <option value="public">Ochiq (hamma ko'ra oladi va qo'shiladi)</option>
              <option value="private">Yopiq (faqat taklif orqali)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
            {loading ? 'Yaratilmoqda...' : 'Davra yaratish'}
          </button>
        </form>
      </div>
    </div>
  );
}
