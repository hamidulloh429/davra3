import { Link } from 'react-router-dom';
import { getStorageUrl } from '../lib/supabase';
import './CircleCard.css';

export default function CircleCard({ circle }) {
  if (!circle) return null;

  const {
    name,
    slug,
    description,
    cover_image,
    member_count = 0,
    category,
    categories,
    privacy_type = 'public',
  } = circle;

  const categoryName = categories?.name || (typeof category === 'string' ? category : 'Umumiy');

  const coverUrl = cover_image
    ? getStorageUrl('circle-covers', cover_image)
    : null;

  // Fallback background color based on name
  const fallbackBg = ['#123CCF', '#06258F', '#10B981', '#7C3AED', '#DB2777'][
    (name.charCodeAt(0) || 0) % 5
  ];

  return (
    <Link to={`/communities/${slug || circle.id}`} className="circle-card card card-interactive">
      <div
        className="circle-cover"
        style={{
          background: coverUrl ? `url(${coverUrl}) center/cover no-repeat` : fallbackBg,
        }}
      >
        <span className="circle-category-badge badge badge-glass">
          {categoryName}
        </span>
        {privacy_type !== 'public' && (
          <span className="circle-privacy-badge badge badge-warning">
            {privacy_type === 'private' ? '🔒 Private' : '🔗 Invite'}
          </span>
        )}
      </div>

      <div className="circle-body">
        <h3 className="circle-title truncate">{name}</h3>
        <p className="circle-desc">{description || 'Davra tavsifi kiritilmagan.'}</p>

        <div className="circle-footer">
          <div className="circle-members text-muted text-xs">
            <span>👥 {member_count} nafar a'zo</span>
          </div>
          <span className="btn btn-sm btn-ghost text-primary">Qo'shilish →</span>
        </div>
      </div>
    </Link>
  );
}
