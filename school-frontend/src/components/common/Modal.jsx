import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Deliberately does NOT close on a backdrop click — a stray click used to silently discard
// whatever someone had typed into a student, billing or homework form. Only the X button,
// Cancel, or Escape close it now, and Escape gives a one-beat "click again to discard" guard
// so a reflex keypress mid-form can't do it by accident either.
export const Modal = ({ isOpen, onClose, title, icon: Icon, children, footer, maxWidth = '580px' }) => {
  const [escArmed, setEscArmed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setEscArmed(false);
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape' || !onClose) return;
      if (escArmed) {
        onClose();
      } else {
        setEscArmed(true);
        window.setTimeout(() => setEscArmed(false), 1500);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, escArmed]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth }}>
        <div className="modal-header">
          <h3 className="card-title" style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {Icon && (
              <span className="modal-header-icon">
                <Icon size={17} />
              </span>
            )}
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="btn-icon"
            style={{ border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
