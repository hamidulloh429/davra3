import Modal from './Modal';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Tasdiqlash',
  message = 'Ushbu amalni bajarmoqchimisiz?',
  confirmText = 'Tasdiqlash',
  cancelText = 'Bekor qilish',
  variant = 'danger'
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="confirm-modal-body text-center">
        <div className={`confirm-icon icon-${variant}`}>
          {variant === 'danger' ? '🗑️' : variant === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions flex justify-end gap-3 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>
            {cancelText}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
