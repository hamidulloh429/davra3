import { useNavigate } from 'react-router-dom';
import './CommunityCard.css';

export default function CommunityCard({ community }) {
  const navigate = useNavigate();
  const coverImage = community.cover_image || community.coverImage;
  const memberCount = community.member_count ?? community.memberCount ?? 0;
  const eventCount = community.event_count ?? community.eventCount ?? 0;

  return (
    <div className="community-card animate-scale-in" onClick={() => navigate(`/communities/${community.slug}`)}>
      <div className="community-cover">
        {coverImage ? (
          <img src={coverImage} alt={community.name} />
        ) : (
          <div className="community-cover-fallback">
            <span>{community.name ? community.name.charAt(0).toUpperCase() : 'D'}</span>
          </div>
        )}
        <span className="community-badge">{community.category || 'Umumiy'}</span>
      </div>
      <div className="community-content">
        <h4 className="community-name">{community.name}</h4>
        <p className="community-desc">{community.description || 'Tavsif kiritilmagan'}</p>
        <div className="community-stats">
          <div className="stat">
            <span className="stat-icon">👥</span>
            <span>{memberCount} a'zo</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📅</span>
            <span>{eventCount} tadbir</span>
          </div>
        </div>
      </div>
    </div>
  );
}
