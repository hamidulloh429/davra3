import { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type} animate-slide-down`}
               style={{
                 padding: '12px 20px',
                 borderRadius: '8px',
                 color: '#fff',
                 fontWeight: 500,
                 boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                 backgroundColor: 
                   toast.type === 'success' ? '#16a34a' : 
                   toast.type === 'error' ? '#dc2626' : 
                   toast.type === 'warning' ? '#f59e0b' : '#1F3A5F',
                 cursor: 'pointer'
               }}
               onClick={() => removeToast(toast.id)}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
