import { useState, useEffect } from 'react';
import { supabase, getAvatarUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../lib/utils';
import CircleCard from '../components/CircleCard';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    interests: [],
  });
  const [interestInput, setInterestInput] = useState('');
  const [myCircles, setMyCircles] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        interests: profile.interests || [],
      });
    }
  }, [profile]);

  useEffect(() => {
    async function fetchUserCircles() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('circle_members')
          .select('*, circles(*, categories(name))')
          .eq('user_id', user.id);

        if (data) {
          setMyCircles(data.map(m => m.circles).filter(Boolean));
        }
      } catch (err) {
        console.error('Fetch circles error:', err);
      }
    }
    fetchUserCircles();
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Avatar fayl hajmi 5MB dan oshmasligi kerak', 'error');
      return;
    }

    try {
      setUploadingAvatar(true);
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData?.publicUrl || filePath;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      showToast('Avatar muvaffaqiyatli almashtirildi!', 'success');
    } catch (err) {
      showToast(err.message || 'Avatar yuklashda xatolik yuz berdi', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddInterest = (e) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      if (!formData.interests.includes(interestInput.trim())) {
        setFormData(prev => ({
          ...prev,
          interests: [...prev.interests, interestInput.trim()]
        }));
      }
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (tag) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== tag)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          username: formData.username.trim().toLowerCase(),
          bio: formData.bio.trim(),
          location: formData.location.trim(),
          website: formData.website.trim(),
          interests: formData.interests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      showToast('Profil muvaffaqiyatli saqlandi!', 'success');
    } catch (err) {
      showToast(err.message || 'Profilni saqlashda xatolik', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="container section text-center">
        <h2>Profil yuklanmoqda...</h2>
      </div>
    );
  }

  return (
    <div className="profile-page container">
      {/* Cover Header Banner */}
      <div className="profile-banner bg-grid-dark">
        <div className="profile-avatar-wrapper">
          <img
            src={getAvatarUrl(profile.avatar_url, profile.full_name)}
            alt={profile.full_name}
            className="profile-avatar"
          />
          <label className="avatar-edit-badge" title="Rasm yuklash">
            <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden disabled={uploadingAvatar} />
            {uploadingAvatar ? '...' : '📷'}
          </label>
        </div>
      </div>

      {/* Main Info */}
      <div className="profile-header-info">
        <div className="profile-titles">
          <h1>{profile.full_name}</h1>
          <span className="profile-username">@{profile.username || 'username'}</span>
        </div>

        <button className="btn btn-outline" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Bekor qilish' : '✏️ Profilni tahrirlash'}
        </button>
      </div>

      {/* Edit Form or View Details */}
      {isEditing ? (
        <form onSubmit={handleSave} className="profile-edit-form card">
          <h3>Profil ma'lumotlarini tahrirlash</h3>

          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">To'liq ism</label>
              <input
                type="text"
                className="input"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                className="input"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="input-group full-width">
              <label className="input-label">Bio (O'zingiz haqingizda)</label>
              <textarea
                className="input"
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Qisqacha o'zingiz haqingizda yozing..."
              />
            </div>

            <div className="input-group">
              <label className="input-label">Joylashuv (Shahar / Mamlakat)</label>
              <input
                type="text"
                className="input"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Toshkent, O'zbekiston"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Veb-sayt URL</label>
              <input
                type="url"
                className="input"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="input-group full-width">
              <label className="input-label">Qiziqishlar (Enter tugmasini bosing)</label>
              <input
                type="text"
                className="input"
                value={interestInput}
                onChange={e => setInterestInput(e.target.value)}
                onKeyDown={handleAddInterest}
                placeholder="Masalan: Startaplar, AI, Dizayn..."
              />
              <div className="interests-tags mt-2">
                {formData.interests.map((tag, idx) => (
                  <span key={idx} className="badge badge-primary">
                    {tag}
                    <button type="button" onClick={() => handleRemoveInterest(tag)} className="tag-remove">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions mt-6">
            <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-details-grid">
          <div className="profile-bio-card card">
            <h3>Haqida</h3>
            <p>{profile.bio || "Foydalanuvchi bio kiritmagan."}</p>

            <div className="profile-meta-list mt-4">
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.website && (
                <span>
                  🌐 <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>
                </span>
              )}
              <span>📅 Qo'shilgan: {formatDate(profile.created_at)}</span>
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-4">
                <h4>Qiziqishlar</h4>
                <div className="interests-tags mt-2">
                  {profile.interests.map((tag, idx) => (
                    <span key={idx} className="badge badge-accent">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="profile-circles-section">
            <h3>A'zo bo'lingan davralar ({myCircles.length})</h3>
            {myCircles.length > 0 ? (
              <div className="profile-circles-grid mt-4">
                {myCircles.map(c => (
                  <CircleCard key={c.id} circle={c} />
                ))}
              </div>
            ) : (
              <p className="text-muted mt-2">Hali hech qaysi davraga qo'shilmadingiz.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
