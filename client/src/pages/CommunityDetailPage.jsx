import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getAvatarUrl, getStorageUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Skeleton from '../components/Skeleton';
import CommunityChat from '../components/CommunityChat';
import './CommunityDetailPage.css';

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [circle, setCircle] = useState(null);
  const [members, setMembers] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'about' | 'members'

  useEffect(() => {
    fetchCircleDetails();
  }, [slug, user]);

  const fetchCircleDetails = async () => {
    try {
      setLoading(true);

      // Fetch circle details by slug or id
      const { data: circleData, error: circleErr } = await supabase
        .from('circles')
        .select('*, categories(name), profiles!creator_id(full_name)')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

      if (circleErr || !circleData) {
        showToast('Davra topilmadi', 'error');
        navigate('/communities');
        return;
      }

      setCircle(circleData);

      // Fetch members
      const { data: memberData } = await supabase
        .from('circle_members')
        .select('*, profiles(*)')
        .eq('circle_id', circleData.id);

      if (memberData) {
        setMembers(memberData);
        if (user) {
          const userIsMember = memberData.some(m => m.user_id === user.id);
          setIsJoined(userIsMember || circleData.creator_id === user.id);
        }
      }
    } catch (err) {
      console.error('Circle detail fetch error:', err);
      showToast('Davrani yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJoin = async () => {
    if (!user) {
      showToast("Davraga qo'shilish uchun avval tizimga kiring", 'warning');
      loginWithGoogle();
      return;
    }

    if (!circle) return;

    setActionLoading(true);
    try {
      if (isJoined) {
        // Leave circle
        const { error } = await supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circle.id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Decrement member count
        await supabase
          .from('circles')
          .update({ member_count: Math.max(1, (circle.member_count || 1) - 1) })
          .eq('id', circle.id);

        setIsJoined(false);
        showToast('Davradan chiqdingiz', 'info');
      } else {
        // Join circle
        const { error } = await supabase
          .from('circle_members')
          .insert({
            circle_id: circle.id,
            user_id: user.id,
            role: 'member'
          });

        if (error) throw error;

        // Increment member count
        await supabase
          .from('circles')
          .update({ member_count: (circle.member_count || 0) + 1 })
          .eq('id', circle.id);

        setIsJoined(true);
        setActiveTab('chat');
        showToast("Davraga muvaffaqiyatli qo'shildingiz!", 'success');
      }
      fetchCircleDetails();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container page-enter" style={{ marginTop: '2rem' }}>
        <Skeleton.Card />
      </div>
    );
  }

  if (!circle) return null;

  const coverUrl = circle.cover_image
    ? getStorageUrl('circle-covers', circle.cover_image)
    : null;

  return (
    <div className="community-detail-page page-enter">
      {/* Cover Header */}
      <div
        className="detail-cover-banner"
        style={{
          background: coverUrl
            ? `linear-gradient(to bottom, rgba(18, 60, 207, 0.4), #123ccf), url(${coverUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1a4ae0 0%, #123ccf 100%)'
        }}
      >
        <div className="page-container cover-content">
          <span className="badge badge-accent mb-2">{circle.categories?.name || 'Hamjamiyat'}</span>
          <h1>{circle.name}</h1>
          <p className="text-secondary">{circle.member_count || members.length} nafar faol a'zo</p>
          <button
            className={`btn ${isJoined ? 'btn-outline' : 'btn-primary'} mt-4 btn-lg`}
            onClick={handleToggleJoin}
            disabled={actionLoading}
          >
            {actionLoading ? 'Kuting...' : isJoined ? 'Davradan chiqish' : "Davraga qo'shilish"}
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="community-tabs-bar">
        <div className="page-container flex gap-3">
          <button
            className={`comm-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Networking Chati
          </button>
          <button
            className={`comm-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            ℹ️ Davra haqida
          </button>
          <button
            className={`comm-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            👥 A'zolar ({members.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="page-container detail-main-content">
        {activeTab === 'chat' && (
          <div className="chat-tab-wrapper animate-fade-in">
            <CommunityChat
              community={circle}
              isJoined={isJoined}
              onJoinRequest={handleToggleJoin}
            />
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-tab-wrapper card card-glass animate-fade-in">
            <h2>Davra Haqida</h2>
            <p className="mt-2 text-secondary">{circle.description || 'Ushbu davra haqida ma\'lumot kiritilmagan.'}</p>

            <div className="circle-meta-list mt-6 pt-6 border-t">
              <div className="meta-item">
                <span className="font-semibold text-accent">Yaratuvchi:</span>{' '}
                <span>{circle.profiles?.full_name || 'Admin'}</span>
              </div>
              <div className="meta-item">
                <span className="font-semibold text-accent">Maxfiylik:</span>{' '}
                <span>{circle.privacy_type === 'public' ? '🌐 Ochiq' : '🔒 Yopiq'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-tab-wrapper animate-fade-in">
            <h2 className="mb-4">Davra a'zolari ({members.length})</h2>
            <div className="card-grid">
              {members.map((m) => {
                const profile = m.profiles || m;
                return (
                  <div key={m.id || profile.id} className="member-card card flex items-center gap-4">
                    <img
                      src={getAvatarUrl(profile.avatar_url, profile.full_name)}
                      alt={profile.full_name || 'Member'}
                      className="avatar avatar-lg"
                    />
                    <div>
                      <h4>{profile.full_name || 'A\'zo'}</h4>
                      <span className="text-xs text-accent font-semibold">@{profile.username || 'username'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
