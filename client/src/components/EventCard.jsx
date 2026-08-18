import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './EventCard.css';

export default function EventCard({ event, onJoinSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(event.is_joined || false);
  const [currentCount, setCurrentCount] = useState(event.member_count || event.participantCount || 0);

  const dateValue = event.event_date || event.date;
  const eventDate = dateValue ? new Date(dateValue) : new Date();
  const maxMembers = event.max_members || event.maxParticipants || 0;
  const isFull = maxMembers > 0 && currentCount >= maxMembers;

  const handleAction = async () => {
    if (!user) {
      showToast('Tadbirga yozilish uchun avval tizimga kiring', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isJoined) {
        await api.post(`/events/${event.id}/leave`);
        setIsJoined(false);
        setCurrentCount(prev => Math.max(0, prev - 1));
        showToast('Tadbirkorlik bekor qilindi', 'info');
      } else {
        await api.post(`/events/${event.id}/join`);
        setIsJoined(true);
        setCurrentCount(prev => prev + 1);
        showToast('Tadbirga muvaffaqiyatli yozildingiz', 'success');
      }
      if (onJoinSuccess) onJoinSuccess();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = maxMembers > 0 ? Math.min(100, (currentCount / maxMembers) * 100) : 0;

  return (
    <div className="event-card">
      <div className="event-date-badge">
        <span className="event-day">{eventDate.getDate()}</span>
        <span className="event-month">{eventDate.toLocaleString('uz-UZ', { month: 'short' })}</span>
      </div>
      <div className="event-details">
        <h4 className="event-title">{event.title}</h4>
        <div className="event-info">
          {event.location && <span>📍 {event.location}</span>}
          <span>🕒 {eventDate.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {maxMembers > 0 && (
          <div className="event-capacity">
            <div className="capacity-text">
              <span>{currentCount} / {maxMembers} ishtirokchi</span>
              {isFull && !isJoined && <span className="full-badge">To'lgan</span>}
            </div>
            <div className="capacity-bar">
              <div 
                className="capacity-fill" 
                style={{ 
                  width: `${progressPercentage}%`, 
                  backgroundColor: isFull ? 'var(--color-terracotta, #c65d3a)' : 'var(--color-turquoise, #2fa7a0)' 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
      <div className="event-actions">
        <button 
          className={`btn ${isJoined ? 'btn-secondary' : 'btn-primary'}`} 
          disabled={loading || (isFull && !isJoined)}
          onClick={handleAction}
        >
          {loading ? '...' : isJoined ? 'Chiqish' : 'Qo\'shilish'}
        </button>
      </div>
    </div>
  );
}
