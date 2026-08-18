/**
 * Davra v2.0 — Utility Functions
 */

/**
 * Format relative time in Uzbek
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'hozirgina';
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} hafta oldin`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} oy oldin`;
  return `${Math.floor(diff / 31536000)} yil oldin`;
}

/**
 * Format date/time for chat messages in Uzbek
 */
export function formatChatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return timeStr;
  if (isYesterday) return `Kecha ${timeStr}`;
  return `${d.getDate()}-${d.toLocaleString('uz-UZ', { month: 'short' })} ${timeStr}`;
}

/**
 * Format date in Uzbek
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength).trim() + '...';
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeText(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate username format
 */
export function validateUsername(username) {
  if (!username) return 'Username kiritish shart';
  if (username.length < 3) return 'Kamida 3 ta belgi bo\'lishi kerak';
  if (username.length > 20) return 'Ko\'pi bilan 20 ta belgi bo\'lishi mumkin';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Faqat harflar, raqamlar va pastki chiziq (_) ishlatilishi mumkin';
  }
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate file for upload
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  } = options;

  if (!file) return 'Fayl tanlanmadi';
  
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / (1024 * 1024));
    return `Fayl hajmi ${sizeMB}MB dan oshmasligi kerak`;
  }

  if (allowedTypes.length && !allowedTypes.includes(file.type)) {
    return `Ruxsat etilmagan fayl turi: ${file.type}`;
  }

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (allowedExtensions.length && !allowedExtensions.includes(ext)) {
    return `Ruxsat etilmagan fayl kengaytmasi: ${ext}`;
  }

  return null;
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Generate slug from text
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Class name helper (simple cn utility)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Check if on mobile device
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * Check reduced motion preference
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
