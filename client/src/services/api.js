export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE_URL = API_URL ? `${API_URL}/api` : '/api';

export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return API_URL ? `${API_URL}${path.startsWith('/') ? '' : '/'}${path}` : path;
}

async function fetchWrapper(endpoint, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = { ...options.headers };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  if (!isFormData && options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const response = await fetch(url, config);
    
    // Attempt to parse JSON response
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = (data && (data.message || data.error)) || (typeof data === 'string' ? data : 'Xatolik yuz berdi');
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

const api = {
  get: (url, options) => fetchWrapper(url, { method: 'GET', ...options }),
  post: (url, body, options) => fetchWrapper(url, { method: 'POST', body, ...options }),
  put: (url, body, options) => fetchWrapper(url, { method: 'PUT', body, ...options }),
  patch: (url, body, options) => fetchWrapper(url, { method: 'PATCH', body, ...options }),
  delete: (url, options) => fetchWrapper(url, { method: 'DELETE', ...options }),
  upload: (url, formData, options) => fetchWrapper(url, { method: 'POST', body: formData, ...options }),
};

export default api;
