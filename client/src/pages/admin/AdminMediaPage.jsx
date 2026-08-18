import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

export default function AdminMediaPage() {
  const { showToast } = useToast();
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedia() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('message_attachments')
          .select('*, messages(circle_id, user_id, profiles(full_name))')
          .order('created_at', { ascending: false })
          .limit(60);

        if (error) throw error;
        setMediaList(data || []);
      } catch (err) {
        showToast(err.message || 'Media fayllarni yuklashda xatolik', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, []);

  const handleDeleteMedia = async (mediaId) => {
    try {
      const { error } = await supabase.from('message_attachments').delete().eq('id', mediaId);
      if (error) throw error;

      showToast("Media fayl o'chirildi", 'info');
      setMediaList(prev => prev.filter(m => m.id !== mediaId));
    } catch (err) {
      showToast(err.message || "O'chirishda xatolik", 'error');
    }
  };

  return (
    <div className="admin-media-page">
      <div className="admin-page-header mb-6">
        <h1>Media Fayllar Boshqaruvi</h1>
        <p className="text-muted">Chat va davralarda yuklangan barcha rasm va videolar ({mediaList.length})</p>
      </div>

      {loading ? (
        <div className="card text-center py-8">
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          <p className="mt-2 text-muted">Yuklanmoqda...</p>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="card text-center py-8 text-muted">Hozircha yuklangan media fayllar yo'q</div>
      ) : (
        <div className="media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {mediaList.map((m) => (
            <div key={m.id} className="card p-2 text-left" style={{ position: 'relative' }}>
              {m.file_type?.startsWith('video') ? (
                <video src={m.file_url} controls style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                <img src={m.file_url} alt="Media" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
              )}
              <div className="mt-2 text-xs text-muted">
                <span className="font-semibold text-text block truncate">{m.original_name || 'fayl'}</span>
                <span>Yukladi: {m.messages?.profiles?.full_name || 'Noma\'lum'}</span>
              </div>
              <button
                className="btn btn-sm btn-danger mt-2 w-full"
                onClick={() => handleDeleteMedia(m.id)}
              >
                🗑️ O'chirish
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
