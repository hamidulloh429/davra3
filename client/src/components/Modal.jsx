import { useEffect } from 'react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, onConfirm, confirmText, cancelText, confirmDanger }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Yopish">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {(onConfirm || cancelText) && (
          <div className="modal-footer">
            {cancelText && (
              <button className="btn btn-ghost" onClick={onClose}>{cancelText}</button>
            )}
            {onConfirm && (
              <button className={`btn ${confirmDanger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
                {confirmText || 'Tasdiqlash'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
