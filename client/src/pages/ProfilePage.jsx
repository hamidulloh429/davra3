import { useState, useEffect } from 'react';
import { supabase, getAvatarUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDate, timeAgo } from '../lib/utils';
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
  const [userMessages, setUserMessages] = useState([]);
  const [stats, setStats] = useState({ total_messages: 0, total_circles: 0 });
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
    async function fetchUserData() {
      if (!user) return;
      try {
        // Fetch user's circles
        const { data: circleData } = await supabase
          .from('circle_members')
          .select('*, circles(*, categories(name))')
          .eq('user_id', user.id);

        if (circleData) {
          const circles = circleData.map(m => m.circles).filter(Boolean);
          setMyCircles(circles);
          setStats(prev => ({ ...prev, total_circles: circles.length }));
        }

        // Fetch user's recent messages for activity timeline
        const { data: msgData, count: msgCount } = await supabase
          .from('messages')
          .select('*, circles(name, slug)', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (msgData) {
          setUserMessages(msgData);
          setStats(prev => ({ ...prev, total_messages: msgCount || msgData.length }));
        }
      } catch (err) {
        console.error('Fetch user activity error:', err);
      }
    }
    fetchUserData();
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
    <div className="profile-page container animate-fade-in">
      {/* Personalized Profile Hero Card */}
      <div className="profile-hero-card card-glass animate-slide-up">
        <div className="profile-hero-top">
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

          <div className="profile-hero-details">
            <div className="flex items-center gap-3">
              <h1>{profile.full_name}</h1>
              <span className="badge badge-accent">@{profile.username || 'username'}</span>
            </div>
            <p className="profile-bio-text">{profile.bio || "Foydalanuvchi qisqa bio kiritmagan."}</p>

            <div className="profile-meta-chips mt-3">
              {profile.location && <span className="meta-chip">📍 {profile.location}</span>}
              {profile.website && (
                <span className="meta-chip">
                  🌐 <a href={profile.website} target="_blank" rel="noreferrer" className="text-accent">{profile.website}</a>
                </span>
              )}
              <span className="meta-chip">📅 Qo'shilgan: {formatDate(profile.created_at)}</span>
            </div>
          </div>

          <button className="btn btn-outline btn-edit-profile" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Bekor qilish' : '✏️ Profilni tahrirlash'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="profile-stats-row mt-6 pt-6 border-t">
          <div className="profile-stat-item">
            <span className="stat-num">{stats.total_circles}</span>
            <span className="stat-lbl">A'zo Davralar</span>
          </div>
          <div className="profile-stat-item">
            <span className="stat-num">{stats.total_messages}</span>
            <span className="stat-lbl">Xabarlar</span>
          </div>
          <div className="profile-stat-item">
            <span className="stat-num">{profile.interests?.length || 0}</span>
            <span className="stat-lbl">Qiziqishlar</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="profile-edit-form card animate-scale-in mt-8">
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
              <label className="input-label">Joylashuv</label>
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
              <label className="input-label">Qiziqishlar (Enter bosing)</label>
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
        <div className="profile-details-grid mt-8">
          {/* Joined Circles */}
          <div className="profile-circles-section">
            <h3 className="section-title text-xl mb-4">A'zo bo'lingan davralar ({myCircles.length})</h3>
            {myCircles.length > 0 ? (
              <div className="profile-circles-grid">
                {myCircles.map(c => (
                  <CircleCard key={c.id} circle={c} />
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <p className="text-muted">Hali hech qaysi davraga qo'shilmadingiz.</p>
              </div>
            )}
          </div>

          {/* Activity Timeline Card */}
          <div className="profile-timeline-card card">
            <h3 className="text-xl mb-4">Faoliyat Tarixi (Activity)</h3>
            {userMessages.length > 0 ? (
              <div className="timeline-list">
                {userMessages.map((msg) => (
                  <div key={msg.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="badge badge-primary">{msg.circles?.name || 'Davra'}</span>
                        <span className="timeline-time">{timeAgo(msg.created_at)}</span>
                      </div>
                      <p className="timeline-msg">"{msg.content}"</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">Suhbatlardagi faoliyatingiz shu yerda ko'rinadi.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
