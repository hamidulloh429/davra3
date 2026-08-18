import { Link } from 'react-router-dom';
import './MaintenancePage.css';

export default function MaintenancePage() {
  return (
    <div className="maintenance-page">
      <div className="maintenance-content card-glass animate-scale-in">
        <div className="maintenance-logo">DAVRA</div>
        <div className="maintenance-icon">🛠️</div>
        <h1 className="maintenance-title">Texnik Xizmat Ko'rsatilmoqda</h1>
        <p className="maintenance-text">
          Davra vaqtincha texnik xizmatda. Tez orada yanada mukammal imkoniyatlar bilan qaytamiz. Noqulayliklar uchun uzr so'raymiz!
        </p>

        <div className="mt-8">
          <Link to="/admin/login" className="btn btn-glass btn-sm">
            Admin Paneli →
          </Link>
        </div>
      </div>
    </div>
  );
}
