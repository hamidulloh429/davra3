import React from 'react';
import './FormField.css';

export default function FormField({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}) {
  return (
    <div className={`form-field-wrapper ${className}`}>
      {label && (
        <label className="form-field-label">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <div className="form-field-control">{children}</div>
      {hint && !error && <span className="form-field-hint">{hint}</span>}
      {error && <span className="form-field-error">{error}</span>}
    </div>
  );
}
