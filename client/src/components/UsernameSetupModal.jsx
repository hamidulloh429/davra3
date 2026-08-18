import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { validateUsername } from '../lib/utils';
import './UsernameSetupModal.css';

export default function UsernameSetupModal() {
  const { needsUsername, setUsername } = useAuth();
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setError(null);
      setIsAvailable(false);
      return;
    }

    const err = validateUsername(value.trim());
    if (err) {
      setError(err);
      setIsAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      setError(null);
      try {
        const { data, error: checkErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', value.trim())
          .maybeSingle();

        if (checkErr) throw checkErr;

        if (data) {
          setError('Ushbu username allaqachon band qilingan');
          setIsAvailable(false);
        } else {
          setIsAvailable(true);
          setError(null);
        }
      } catch (e) {
        setError('Tekshirishda xatolik yuz berdi');
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  if (!needsUsername) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAvailable || submitting) return;

    setSubmitting(true);
    const res = await setUsername(value.trim());
    if (!res.success) {
      setError(res.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="username-modal-backdrop">
      <div className="username-modal-card card-glass animate-scale-in">
        <div className="username-modal-icon">🎉</div>
        <h2>Davra ga xush kelibsiz!</h2>
        <p>Tizimda davom etish uchun o'zingizga mos noyob username tanlang:</p>

        <form onSubmit={handleSubmit} className="username-form">
          <div className="input-group">
            <div className="username-input-wrapper">
              <span className="username-prefix">@</span>
              <input
                type="text"
                className={`input ${error ? 'input-error' : isAvailable ? 'input-success' : ''}`}
                placeholder="username"
                value={value}
                onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={20}
                autoFocus
                disabled={submitting}
              />
              {isChecking && <span className="username-checking-spinner spinner spinner-sm" />}
            </div>

            {error && <span className="input-error-text">{error}</span>}
            {isAvailable && <span className="username-available-text">✓ Username bo'sh va tayyor!</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full mt-4"
            disabled={!isAvailable || submitting}
          >
            {submitting ? 'Saqlanmoqda...' : 'Davom etish'}
          </button>
        </form>
      </div>
    </div>
  );
}
