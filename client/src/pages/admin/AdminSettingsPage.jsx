import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    site_name: 'Davra',
    description: 'Sizga mos odamlar bilan bir davrada.',
    logo_url: '',
    primary_color: '#123CCF',
    accent_color: '#B7FF00',
    hero_title: 'YOUR COMMUNITY. YOUR DAVRA.',
    contact_email: '',
    telegram_url: '',
    instagram_url: '',
    footer_text: '',
    registration_enabled: true,
    maintenance_mode: false,
    max_image_size: 10485760,
    max_video_size: 100485760,
    max_message_length: 2000,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSiteSettings() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (data) setSettings(data);
      } catch (err) {
        console.error('Site settings fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSiteSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 1,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        admin_id: admin?.id,
        action: 'site_settings_updated',
        target_type: 'settings',
        target_id: '1',
      });

      showToast('Sayt sozlamalari saqlandi!', 'success');
    } catch (err) {
      showToast(err.message || 'Saqlashda xatolik', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings-page">
      <div className="admin-page-header mb-6">
        <h1>Platforma sozlamalari</h1>
        <p className="text-muted">Butun platforma uchun umumiy konfiguratsiya va chegaralar</p>
      </div>

      <form onSubmit={handleSave} className="card p-8 text-left">
        <div className="form-grid">
          {/* General */}
          <div className="full-width">
            <h3>Umumiy ma'lumotlar</h3>
            <hr className="divider" />
          </div>

          <div className="input-group">
            <label className="input-label">Sayt Nomi</label>
            <input
              type="text"
              className="input"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Hero Sarlavhasi</label>
            <input
              type="text"
              className="input"
              value={settings.hero_title}
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
              required
            />
          </div>

          <div className="input-group full-width">
            <label className="input-label">Tavsif (Description)</label>
            <textarea
              className="input"
              rows={2}
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
            />
          </div>

          {/* Contact */}
          <div className="full-width mt-6">
            <h3>Aloqa va Ijtimoiy tarmoqlar</h3>
            <hr className="divider" />
          </div>

          <div className="input-group">
            <label className="input-label">Aloqa Emaili</label>
            <input
              type="email"
              className="input"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Telegram Kanal URL</label>
            <input
              type="url"
              className="input"
              value={settings.telegram_url}
              onChange={(e) => setSettings({ ...settings, telegram_url: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Instagram URL</label>
            <input
              type="url"
              className="input"
              value={settings.instagram_url}
              onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
            />
          </div>

          {/* System & Modes */}
          <div className="full-width mt-6">
            <h3>Tizim Rejimlari & Chegaralar</h3>
            <hr className="divider" />
          </div>

          <div className="input-group">
            <label className="input-label">Max Rasm Hajmi (Baytda)</label>
            <input
              type="number"
              className="input"
              value={settings.max_image_size}
              onChange={(e) => setSettings({ ...settings, max_image_size: parseInt(e.target.value) })}
            />
            <span className="input-hint">Hozirgi: {Math.round(settings.max_image_size / (1024 * 1024))} MB</span>
          </div>

          <div className="input-group">
            <label className="input-label">Max Video Hajmi (Baytda)</label>
            <input
              type="number"
              className="input"
              value={settings.max_video_size}
              onChange={(e) => setSettings({ ...settings, max_video_size: parseInt(e.target.value) })}
            />
            <span className="input-hint">Hozirgi: {Math.round(settings.max_video_size / (1024 * 1024))} MB</span>
          </div>

          <div className="input-group">
            <label className="input-label">Max Xabar Uzunligi (Belgilar)</label>
            <input
              type="number"
              className="input"
              value={settings.max_message_length}
              onChange={(e) => setSettings({ ...settings, max_message_length: parseInt(e.target.value) })}
            />
          </div>

          <div className="full-width flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.registration_enabled}
                onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
              />
              <span className="font-semibold">Ro'yxatdan o'tish ochiq</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-error">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
              />
              <span className="font-semibold">🛠️ Maintenance Mode (Texnik xizmat rejimi)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}
