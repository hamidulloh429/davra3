import './Skeleton.css';

const Skeleton = () => null;

Skeleton.Card = function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-cover shimmer"></div>
      <div className="skeleton-content">
        <div className="skeleton-line title shimmer"></div>
        <div className="skeleton-line shimmer"></div>
        <div className="skeleton-line short shimmer"></div>
      </div>
    </div>
  );
};

Skeleton.Text = function SkeletonText({ lines = 1 }) {
  return (
    <div className="skeleton-text-wrapper">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton-line shimmer ${i === lines - 1 ? 'short' : ''}`}></div>
      ))}
    </div>
  );
};

Skeleton.Avatar = function SkeletonAvatar({ size = '40px' }) {
  return <div className="skeleton-avatar shimmer" style={{ width: size, height: size }}></div>;
};

export default Skeleton;
