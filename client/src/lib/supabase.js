import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase sozlamalari topilmadi. VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY .env faylida ko\'rsatilishi kerak.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Get public URL for a file in Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within the bucket
 * @returns {string} Public URL
 */
export function getStorageUrl(bucket, path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

/**
 * Get avatar URL with fallback
 * @param {string} avatarUrl - Avatar URL or path
 * @param {string} name - User name for fallback
 * @returns {string} Avatar URL
 */
export function getAvatarUrl(avatarUrl, name = 'User') {
  if (avatarUrl) {
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return getStorageUrl('avatars', avatarUrl);
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=123CCF&color=fff&bold=true`;
}

export default supabase;
