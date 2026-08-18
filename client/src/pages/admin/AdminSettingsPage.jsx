import { useState, useEffect } from 'react';
import { supabase, getStorageUrl } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import FormField from '../../components/FormField';

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
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  // Handle Logo Upload to site-assets bucket
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Logo hajmi 5MB dan oshmasligi kerak", "error");
      return;
    }

    try {
      setUploadingLogo(true);
      const ext = file.name.split('.').pop();
      const filePath = `site_logo_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) {
        // Fallback to chat-media bucket if site-assets not auto created
        const { error: fallbackErr } = await supabase.storage
          .from('chat-media')
          .upload(`logo/${filePath}`, file, { upsert: true });

        if (fallbackErr) throw fallbackErr;
        const publicUrl = getStorageUrl('chat-media', `logo/${filePath}`);
        setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      } else {
        const publicUrl = getStorageUrl('site-assets', filePath);
        setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      }

      showToast("Sayt logosi muvaffaqiyatli yuklandi!", "success");
    } catch (err) {
      showToast(err.message || "Logo yuklashda xatolik", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

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

      showToast('Sayt sozlamalari va Logo saqlandi!', 'success');
    } catch (err) {
      showToast(err.message || 'Saqlashda xatolik', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings-page page-enter">
      <div className="admin-page-header mb-6">
        <span className="badge badge-accent mb-2">⚙️ Sozlamalar</span>
        <h1>Platforma Sozlamalari & Logo</h1>
        <p className="text-muted">Butun platforma uchun logo, brending va chegaralar</p>
      </div>

      <form onSubmit={handleSave} className="card p-8 text-left card-glass">
        <div className="form-grid">
          {/* Logo Management Section */}
          <div className="full-width">
            <h3>Sayt Logosi (Brand Logo)</h3>
            <hr className="divider" />
            <div className="logo-management-box flex items-center gap-6 my-4 p-4 card">
              <div className="logo-preview-container">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Site Logo" style={{ height: '54px', objectFit: 'contain' }} />
                ) : (
                  <div className="text-2xl font-black text-accent">DAVRA</div>
                )}
              </div>

              <div className="flex-1">
                <label className="btn btn-outline btn-sm cursor-pointer">
                  <span>{uploadingLogo ? 'Yuklanmoqda...' : '📷 Yangi Logo Fayl Yuklash'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} hidden disabled={uploadingLogo} />
                </label>
                <p className="text-xs text-muted mt-2">
                  Formatlar: PNG, SVG, WEBP. Maksimal hajm: 5MB. Logotip header va footer'da namoyon bo'ladi.
                </p>
              </div>
            </div>
          </div>

          {/* General Details */}
          <div className="full-width mt-4">
            <h3>Umumiy ma'lumotlar</h3>
            <hr className="divider" />
          </div>

          <FormField label="Sayt Nomi" required>
            <input
              type="text"
              className="input"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Hero Sarlavhasi" required>
            <input
              type="text"
              className="input"
              value={settings.hero_title}
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
              required
            />
          </FormField>

          <div className="full-width">
            <FormField label="Tavsif (Description)">
              <textarea
                className="input"
                rows={2}
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              />
            </FormField>
          </div>

          {/* Contact */}
          <div className="full-width mt-4">
            <h3>Aloqa va Ijtimoiy tarmoqlar</h3>
            <hr className="divider" />
          </div>

          <FormField label="Aloqa Emaili">
            <input
              type="email"
              className="input"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            />
          </FormField>

          <FormField label="Telegram Kanal URL">
            <input
              type="url"
              className="input"
              value={settings.telegram_url}
              onChange={(e) => setSettings({ ...settings, telegram_url: e.target.value })}
            />
          </FormField>

          <FormField label="Instagram URL">
            <input
              type="url"
              className="input"
              value={settings.instagram_url}
              onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
            />
          </FormField>

          {/* Limits & Modes */}
          <div className="full-width mt-4">
            <h3>Tizim Rejimlari & Chegaralar</h3>
            <hr className="divider" />
          </div>

          <FormField label="Max Rasm Hajmi (Baytda)" hint={`Hozirgi: ${Math.round(settings.max_image_size / (1024 * 1024))} MB`}>
            <input
              type="number"
              className="input"
              value={settings.max_image_size}
              onChange={(e) => setSettings({ ...settings, max_image_size: parseInt(e.target.value) })}
            />
          </FormField>

          <FormField label="Max Video Hajmi (Baytda)" hint={`Hozirgi: ${Math.round(settings.max_video_size / (1024 * 1024))} MB`}>
            <input
              type="number"
              className="input"
              value={settings.max_video_size}
              onChange={(e) => setSettings({ ...settings, max_video_size: parseInt(e.target.value) })}
            />
          </FormField>

          <FormField label="Max Xabar Uzunligi (Belgilar)">
            <input
              type="number"
              className="input"
              value={settings.max_message_length}
              onChange={(e) => setSettings({ ...settings, max_message_length: parseInt(e.target.value) })}
            />
          </FormField>

          <div className="full-width flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.registration_enabled}
                onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
              />
              <span className="font-semibold text-accent">Ro'yxatdan o'tish ochiq</span>
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
