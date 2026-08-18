import './EmptyState.css';

export default function EmptyState({ icon = '🔍', title, description, actionText, onAction }) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>{actionText}</button>
      )}
    </div>
  );
}
