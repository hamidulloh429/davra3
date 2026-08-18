import React from 'react';
import './FormField.css';

export default function FormField({ label, children, required, className = '' }) {
  return (
    <div className={`form-field-group ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', width: '100%' }}>
      {label && (
        <label style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14px', textAlign: 'left' }}>
          {label} {required && <span style={{ color: 'var(--color-accent)' }}>*</span>}
        </label>
      )}
      {children}
    </div>
  );
}
