import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, profile, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('privacy'); // privacy, notifications, security, account

  const [settings, setSettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    allow_messages: true,
    allow_mentions: true,
    notify_new_message: true,
    notify_mention: true,
    notify_circle_activity: true,
    notify_system: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) setSettings(data);
      } catch (err) {
        console.error('Settings load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      showToast('Sozlamalar saqlandi!', 'success');
    } catch (err) {
      showToast(err.message || 'Saqlashda xatolik', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await supabase.from('profiles').delete().eq('id', user.id);
      await logout();
      showToast("Hisobingiz muvaffaqiyatli o'chirildi", 'info');
    } catch (err) {
      showToast(err.message || "Hisobni o'chirishda xatolik", 'error');
    }
  };

  if (!user) {
    return (
      <div className="container section text-center">
        <h2>Sozlamalarni ko'rish uchun tizimga kiring</h2>
      </div>
    );
  }

  return (
    <div className="settings-page container">
      <h1>Sozlamalar</h1>

      <div className="settings-layout mt-6">
        <div className="settings-tabs">
          <button className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            🔒 Maxfiylik
          </button>
          <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            🔔 Bildirishnomalar
          </button>
          <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            🛡️ Xavfsizlik
          </button>
          <button className={`tab-btn danger ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            ⚠️ Hisobni o'chirish
          </button>
        </div>

        <div className="settings-content card">
          {activeTab === 'privacy' && (
            <div className="settings-group">
              <h3>Maxfiylik sozlamalari</h3>
              <p className="text-muted mb-6">Profil va ma'lumotlaringiz ko'rinishini boshqaring.</p>

              <div className="toggle-row">
                <div>
                  <span className="toggle-title">Elektron pochtani ko'rsatish</span>
                  <span className="toggle-desc">Profil sahifangizda email manzil ko'rinishi</span>
                </div>
                <input type="checkbox" checked={settings.show_email} onChange={() => handleToggle('show_email')} />
              </div>

              <div className="toggle-row">
                <div>
                  <span className="toggle-title">Xabarlarga ruxsat berish</span>
                  <span className="toggle-desc">Boshqa foydalanuvchilar sizga xabar yubora olishi</span>
                </div>
                <input type="checkbox" checked={settings.allow_messages} onChange={() => handleToggle('allow_messages')} />
              </div>

              <div className="toggle-row">
                <div>
                  <span className="toggle-title">Mention (@) belgilariga ruxsat</span>
                  <span className="toggle-desc">Chatlarda sizni tag qila olishlari</span>
                </div>
                <input type="checkbox" checked={settings.allow_mentions} onChange={() => handleToggle('allow_mentions')} />
              </div>

              <button className="btn btn-primary mt-6" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-group">
              <h3>Bildirishnoma sozlamalari</h3>
              <p className="text-muted mb-6">Haqiqiy vaqtli bildirishnomalar chastotasi.</p>

              <div className="toggle-row">
                <div>
                  <span className="toggle-title">Yangi xabarlar</span>
                  <span className="toggle-desc">Davralarda yangi xabar kelganda</span>
                </div>
                <input type="checkbox" checked={settings.notify_new_message} onChange={() => handleToggle('notify_new_message')} />
              </div>

              <div className="toggle-row">
                <div>
                  <span className="toggle-title">Mentions & Javoblar</span>
                  <span className="toggle-desc">Sizga tag qilinganda yoki javob yozilganda</span>
                </div>
                <input type="checkbox" checked={settings.notify_mention} onChange={() => handleToggle('notify_mention')} />
              </div>

              <div className="toggle-row">
                <div>
                  <span className="toggle-title">Tizim e'lonlari</span>
                  <span className="toggle-desc">Admin va tizim Yangiliklari</span>
                </div>
                <input type="checkbox" checked={settings.notify_system} onChange={() => handleToggle('notify_system')} />
              </div>

              <button className="btn btn-primary mt-6" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-group">
              <h3>Xavfsizlik & Sessiyalar</h3>
              <p className="text-muted mb-6">Aktiv sessiyalarni va kirish qurilmalarini boshqaring.</p>

              <div className="card bg-surface mb-6">
                <h4>Aktiv qurilma</h4>
                <p className="text-muted text-sm mt-1">Hozirgi brauzer va sessiya muvaffaqiyatli ulangan.</p>
              </div>

              <button className="btn btn-outline btn-danger" onClick={() => logout()}>
                Barcha qurilmalardan chiqish
              </button>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-group">
              <h3 className="text-error">Hisobni o'chirish</h3>
              <p className="text-muted mb-6">
                Hisobingiz butunlay o'chiriladi va barcha ma'lumotlaringiz (xabarlar, profil, a'zolik) qayta tiklanmaydigan qilib o'chiriladi.
              </p>

              <button className="btn btn-danger btn-lg" onClick={() => setShowDeleteModal(true)}>
                Hisobimni o'chirish
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Hisobni o'chirishni tasdiqlaysizmi?"
        message="Haqiqatan ham hisobingizni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
        variant="danger"
      />
    </div>
  );
}
