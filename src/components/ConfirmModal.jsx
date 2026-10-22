import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, AlertCircle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  subtext,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  itemName,
  itemDetails = [],
  icon: CustomIcon,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const IconComponent = CustomIcon || (variant === 'danger' ? Trash2 : AlertTriangle);

  return (
    <div className="admin-confirm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`admin-confirm-card glass-panel admin-confirm-card--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="admin-confirm-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="admin-confirm-top">
          <div className={`admin-confirm-icon-box admin-confirm-icon-box--${variant}`}>
            <IconComponent size={24} />
          </div>

          <div className="admin-confirm-header-text">
            <h3 className="admin-confirm-title">{title}</h3>
            {message && <p className="admin-confirm-msg">{message}</p>}
          </div>
        </div>

        {itemName && (
          <div className="admin-confirm-item-preview">
            <span className="admin-confirm-item-label">Target:</span>
            <strong className="admin-confirm-item-name">{itemName}</strong>
          </div>
        )}

        {itemDetails && itemDetails.length > 0 && (
          <div className="admin-confirm-details-list">
            {itemDetails.map((item, idx) => (
              <div key={idx} className="admin-confirm-detail-row">
                <span className="detail-row-label">{item.label}</span>
                <span className="detail-row-val">{item.value || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {subtext && (
          <div className="admin-confirm-warning-banner">
            <AlertCircle size={14} />
            <span>{subtext}</span>
          </div>
        )}

        <div className="admin-confirm-actions">
          <button
            type="button"
            className="btn btn-outline-gold admin-confirm-cancel-btn"
            onClick={onClose}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn admin-confirm-btn admin-confirm-btn--${variant}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <IconComponent size={15} />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
