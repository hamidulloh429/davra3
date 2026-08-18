import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getAssetUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EventCard from '../components/EventCard';
import Skeleton from '../components/Skeleton';
import CommunityChat from '../components/CommunityChat';
import './CommunityDetailPage.css';

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'about' | 'members'

  useEffect(() => {
    fetchCommunityData();
  }, [slug]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/communities/${slug}`);
      if (res && res.community) {
        setCommunity(res.community);
        setMembers(res.members || []);
        setEvents(res.events || []);
      } else {
        showToast('Davra topilmadi', 'error');
        navigate('/communities');
      }
    } catch (err) {
      showToast('Davra topilmadi', 'error');
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  };

  const isJoined = user && (members.some(m => m.id === user.id) || (community && community.owner_id === user.id));

  const toggleJoin = async () => {
    if (!user) {
      showToast('Davraga qo\'shilish uchun avval tizimga kiring', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      if (isJoined) {
        await api.post(`/communities/${community.id}/leave`);
        showToast('Davradan chiqdingiz', 'info');
      } else {
        await api.post(`/communities/${community.id}/join`);
        showToast("Davraga muvaffaqiyatli qo'shildingiz", 'success');
        setActiveTab('chat'); // Auto-switch to chat upon joining
      }
      fetchCommunityData();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <Skeleton.Card />
      </div>
    );
  }
  
  if (!community) return null;

  return (
    <div className="community-detail">
      <div className="detail-cover">
        <div 
          className="cover-bg" 
          style={{ 
            backgroundImage: community.cover_image ? `url(${community.cover_image})` : 'none',
            backgroundColor: 'var(--color-indigo, #1f3a5f)'
          }}
        ></div>
        <div className="container cover-content">
          <span className="badge">{community.category}</span>
          <h1>{community.name}</h1>
          <p>{community.member_count || members.length} nafar faol a'zo</p>
          <button 
            className={`btn ${isJoined ? 'btn-ghost' : 'btn-primary'} mt-4`}
            onClick={toggleJoin}
            disabled={actionLoading}
            style={{ backgroundColor: isJoined ? '#ffffff' : '', color: isJoined ? '#0f1f33' : '' }}
          >
            {actionLoading ? 'Kuting...' : isJoined ? 'Davradan chiqish' : "Davraga qo'shilish"}
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="community-tabs-nav container">
        <button 
          className={`comm-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Networking Chati
          {isJoined && <span className="tab-dot"></span>}
        </button>
        <button 
          className={`comm-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          ℹ️ Davra haqida & Tadbirlar ({events.length})
        </button>
        <button 
          className={`comm-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 A'zolar ({members.length})
        </button>
      </div>

      <div className="container detail-content">
        {activeTab === 'chat' && (
          <div className="chat-layout-full animate-fade-in">
            <CommunityChat 
              community={community} 
              isJoined={isJoined} 
              onJoinRequest={toggleJoin} 
            />
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-layout animate-fade-in">
            <div className="main-col">
              <section className="about-section card">
                <h2>Davra haqida</h2>
                <p>{community.description || 'Ushbu davra haqida ma\'lumot kiritilmagan.'}</p>
              </section>

              <section className="events-section">
                <h2>Yaqinlashayotgan Tadbirlar ({events.length})</h2>
                {events.length > 0 ? (
                  events.map(event => <EventCard key={event.id} event={event} onJoinSuccess={fetchCommunityData} />)
                ) : (
                  <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <p>Hozircha rejalashtirilgan tadbirlar yo'q.</p>
                  </div>
                )}
              </section>
            </div>
            
            <div className="side-col">
              <section className="members-section card">
                <h3>A'zolar ({members.length})</h3>
                <div className="members-grid">
                  {members.length > 0 ? (
                    members.map((m, i) => (
                      <div key={m.id || i} className="member-avatar" title={m.full_name}>
                        <img 
                          src={getAssetUrl(m.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name || 'User')}&background=d89b3d&color=fff`} 
                          alt={m.full_name || 'A\'zo'} 
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">Hozircha a'zolar yo'q.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-full-layout card animate-fade-in">
            <h2>Davra a'zolari ({members.length})</h2>
            <div className="members-cards-grid">
              {members.map((m) => (
                <div key={m.id} className="member-card">
                  <div className="member-card-avatar">
                    <img 
                      src={getAssetUrl(m.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name || 'User')}&size=80&background=1F3A5F&color=fff`} 
                      alt={m.full_name} 
                    />
                  </div>
                  <div className="member-card-info">
                    <h4>{m.full_name}</h4>
                    {m.role && (
                      <span className="badge" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                        {m.role === 'owner' ? 'Egasi' : m.role === 'moderator' ? 'Moderator' : "A'zo"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
