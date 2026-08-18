const fs = require('fs');
const path = require('path');

const files = {
  'src/components/EmptyState.jsx': `
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
`,
  'src/components/EmptyState.css': `
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
  text-align: center;
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-gray-300);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
  opacity: 0.8;
}

.empty-state h3 {
  margin-bottom: var(--space-2);
  color: var(--color-indigo);
}

.empty-state p {
  color: var(--color-gray-500);
  margin-bottom: var(--space-6);
  max-width: 400px;
}
`,
  'src/components/SearchBar.jsx': `
import { useState, useEffect } from 'react';
import './SearchBar.css';

export default function SearchBar({ onSearch, placeholder = 'Qidirish...' }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) onSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input 
        type="text" 
        className="search-input" 
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {query && (
        <button className="search-clear" onClick={() => setQuery('')}>&times;</button>
      )}
    </div>
  );
}
`,
  'src/components/SearchBar.css': `
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: var(--space-3);
  color: var(--color-gray-400);
}

.search-input {
  width: 100%;
  padding: var(--space-3) var(--space-8) var(--space-3) var(--space-10);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-full);
  background-color: var(--color-white);
  transition: all var(--transition-fast);
  font-size: var(--text-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-turquoise);
  box-shadow: 0 0 0 4px rgba(47, 167, 160, 0.1);
}

.search-clear {
  position: absolute;
  right: var(--space-3);
  background: none;
  border: none;
  font-size: 20px;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0 4px;
}

.search-clear:hover {
  color: var(--color-terracotta);
}
`,
  'src/layouts/MainLayout.jsx': `
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <Navbar />
      <motion.main 
        className="main-content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  );
}
`,
  'src/layouts/MainLayout.css': `
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding-bottom: var(--space-12);
}
`,
  'src/layouts/AdminLayout.jsx': `
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import './AdminLayout.css';

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();

  if (!admin) return null; // Or redirect

  const navItems = [
    { path: '/admin', label: 'Boshqaruv paneli', icon: '📊' },
    { path: '/admin/users', label: 'Foydalanuvchilar', icon: '👥' },
    { path: '/admin/communities', label: 'Davralar', icon: '🌐' },
    { path: '/admin/admins', label: 'Adminlar', icon: '🛡️' },
    { path: '/admin/settings', label: 'Sozlamalar', icon: '⚙️' },
    { path: '/admin/audit-logs', label: 'Jurnal', icon: '📝' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>DAVRA</h2>
          <span>Admin</span>
        </div>
        <nav className="admin-nav">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={\`admin-nav-item \${location.pathname === item.path ? 'active' : ''}\`}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </Link>
          ))}
          <div className="admin-nav-divider"></div>
          <Link to="/" className="admin-nav-item">
            <span className="icon">🏠</span>
            <span className="label">Saytga qaytish</span>
          </Link>
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <h3>{navItems.find(i => i.path === location.pathname)?.label || 'Admin Panel'}</h3>
          </div>
          <div className="admin-header-user">
            <span>{admin.name || admin.username}</span>
            <button className="btn btn-ghost" onClick={logout}>Chiqish</button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
`,
  'src/layouts/AdminLayout.css': `
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-gray-100);
}

.admin-sidebar {
  width: 250px;
  background-color: var(--color-navy);
  color: var(--color-white);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-fast);
}

.admin-brand {
  padding: var(--space-6);
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.admin-brand h2 {
  color: var(--color-ochre);
  margin: 0;
}

.admin-brand span {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-gray-400);
}

.admin-nav {
  padding: var(--space-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.admin-nav-item {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  color: var(--color-gray-300);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.admin-nav-item:hover, .admin-nav-item.active {
  background-color: rgba(255,255,255,0.05);
  color: var(--color-white);
  border-left: 4px solid var(--color-turquoise);
}

.admin-nav-item .icon {
  margin-right: var(--space-3);
  font-size: 1.2rem;
}

.admin-nav-divider {
  height: 1px;
  background-color: rgba(255,255,255,0.1);
  margin: var(--space-4) var(--space-6);
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  height: 70px;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-6);
}

.admin-header-title h3 {
  margin: 0;
  color: var(--color-navy);
}

.admin-header-user {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.admin-content {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  .admin-sidebar {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
  }
  .admin-brand {
    padding: 0;
    border: none;
  }
  .admin-nav {
    flex-direction: row;
    padding: 0;
    overflow-x: auto;
  }
  .admin-nav-item .label {
    display: none;
  }
  .admin-nav-item {
    padding: var(--space-2);
    border: none;
  }
  .admin-nav-item:hover, .admin-nav-item.active {
    border-left: none;
    border-bottom: 2px solid var(--color-turquoise);
  }
  .admin-nav-divider { display: none; }
}
`,
  'src/pages/HomePage.jsx': `
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DavraVisualization from '../components/DavraVisualization';
import api from '../services/api';
import './HomePage.css';

export default function HomePage() {
  const [stats, setStats] = useState({ communities: 0, users: 0, events: 0 });

  useEffect(() => {
    api.get('/stats').then(res => setStats(res)).catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content animate-slide-up">
            <h1 className="hero-title">
              Sizga mos odamlar bilan <br/>
              <span className="text-highlight">bir davrada.</span>
            </h1>
            <p className="hero-desc">
              Qiziqishlaringizga mos hamjamiyatlarni toping, yangi insonlar bilan tanishing va o'z davrangizni yarating.
            </p>
            <div className="hero-actions">
              <Link to="/communities" className="btn btn-primary btn-lg">Davralarni topish</Link>
              <Link to="/communities/new" className="btn btn-secondary btn-lg">Davra yaratish</Link>
            </div>
          </div>
          <div className="hero-viz animate-fade-in">
            <DavraVisualization />
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container stats-container">
          <div className="stat-card">
            <h3>{stats.communities || '120+'}</h3>
            <p>Faol davralar</p>
          </div>
          <div className="stat-card">
            <h3>{stats.users || '5000+'}</h3>
            <p>A'zolar</p>
          </div>
          <div className="stat-card">
            <h3>{stats.events || '300+'}</h3>
            <p>Tadbirlar</p>
          </div>
        </div>
      </section>

      <section className="features-section container">
        <h2 className="text-center section-title">Nega aynan Davra?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Qiziqishlar bo'yicha</h3>
            <p>Siz bilan bir xil qiziqishlarga ega bo'lgan insonlarni oson toping va ular bilan tajriba almashing.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Yangi tanishuvlar</h3>
            <p>Tarmoq (networking) orqali karerangiz va shaxsiy rivojlanishingiz uchun foydali aloqalarni o'rnating.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Jonli uchrashuvlar</h3>
            <p>Onlayn muloqotdan tashqari oflayn tadbirlar va uchrashuvlarda ishtirok eting.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container text-center">
          <h2>O'z davrangizni hoziroq yarating</h2>
          <p>Hamjamiyat yaratish bepul va juda oson.</p>
          <Link to="/communities/new" className="btn btn-primary btn-lg mt-4">Boshlash</Link>
        </div>
      </section>
    </div>
  );
}
`,
  'src/pages/HomePage.css': `
.hero-section {
  padding: var(--space-16) 0;
  overflow: hidden;
}

.hero-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: clamp(3rem, 5vw, 4.5rem);
  line-height: 1.1;
  margin-bottom: var(--space-6);
  color: var(--color-navy);
}

.text-highlight {
  color: var(--color-terracotta);
  position: relative;
  display: inline-block;
}

.text-highlight::after {
  content: '';
  position: absolute;
  bottom: 10px;
  left: 0;
  width: 100%;
  height: 15px;
  background-color: var(--color-ochre-light);
  z-index: -1;
  opacity: 0.5;
  transform: rotate(-2deg);
}

.hero-desc {
  font-size: var(--text-lg);
  color: var(--color-gray-600);
  margin-bottom: var(--space-8);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
}

.hero-viz {
  flex: 1;
  display: flex;
  justify-content: center;
}

.stats-section {
  background-color: var(--color-indigo);
  padding: var(--space-12) 0;
  color: var(--color-white);
}

.stats-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.stat-card {
  text-align: center;
}

.stat-card h3 {
  color: var(--color-ochre);
  font-size: var(--text-4xl);
  margin-bottom: var(--space-2);
}

.features-section {
  padding: var(--space-16) 0;
}

.section-title {
  margin-bottom: var(--space-12);
}

.text-center {
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-8);
}

.feature-card {
  background-color: var(--color-white);
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  text-align: center;
  transition: transform var(--transition-normal);
}

.feature-card:hover {
  transform: translateY(-10px);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
}

.cta-section {
  background-color: var(--color-ochre-light);
  padding: var(--space-16) 0;
  margin-top: var(--space-8);
}

.mt-4 { margin-top: var(--space-4); }

@media (max-width: 992px) {
  .hero-container {
    flex-direction: column;
    text-align: center;
  }
  .hero-actions {
    justify-content: center;
  }
  .hero-viz {
    margin-top: var(--space-8);
  }
}

@media (max-width: 480px) {
  .hero-actions {
    flex-direction: column;
  }
}
`,
  'src/pages/CommunitiesPage.jsx': `
import { useState, useEffect } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import CommunityCard from '../components/CommunityCard';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import './CommunitiesPage.css';

const CATEGORIES = ['Hammasi', 'Texnologiya', "San'at", 'Sport', "Ta'lim", 'Biznes', "Sog'liq", 'Sayohat', 'Musiqa', 'Boshqa'];

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Hammasi');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        let url = '/communities?';
        if (category !== 'Hammasi') url += \`category=\${encodeURIComponent(category)}&\`;
        if (search) url += \`search=\${encodeURIComponent(search)}&\`;
        url += \`sort=\${sort}\`;
        
        const data = await api.get(url);
        setCommunities(Array.isArray(data) ? data : data.communities || []);
      } catch (err) {
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, [category, search, sort]);

  return (
    <div className="container communities-page">
      <div className="page-header">
        <h1>Davralar</h1>
        <p>O'zingizga yoqqan hamjamiyatni toping va unga qo'shiling.</p>
      </div>

      <div className="filters-section">
        <div className="search-wrapper">
          <SearchBar onSearch={setSearch} />
        </div>
        <div className="filter-controls">
          <select 
            className="form-control category-select" 
            value={category} 
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            className="form-control sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="popular">Mashhur</option>
            <option value="newest">Eng yangi</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="communities-grid">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton.Card key={i} />)}
        </div>
      ) : communities.length > 0 ? (
        <div className="communities-grid">
          {communities.map(c => <CommunityCard key={c.id || c._id} community={c} />)}
        </div>
      ) : (
        <EmptyState 
          title="Hozircha davralar mavjud emas" 
          description="Siz qidirayotgan mezonlarga mos davra topilmadi." 
        />
      )}
    </div>
  );
}
`,
  'src/pages/CommunitiesPage.css': `
.communities-page {
  padding-top: var(--space-8);
}

.page-header {
  margin-bottom: var(--space-8);
  text-align: center;
}

.filters-section {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  flex-wrap: wrap;
}

.search-wrapper {
  flex: 1;
  min-width: 300px;
}

.filter-controls {
  display: flex;
  gap: var(--space-4);
}

.category-select, .sort-select {
  width: auto;
  min-width: 150px;
}

.communities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

@media (max-width: 768px) {
  .filter-controls {
    width: 100%;
  }
  .category-select, .sort-select {
    flex: 1;
  }
}
`,
  'src/pages/CommunityDetailPage.jsx': `
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EventCard from '../components/EventCard';
import Skeleton from '../components/Skeleton';
import './CommunityDetailPage.css';

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [community, setCommunity] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cData, eData] = await Promise.all([
          api.get(\`/communities/\${slug}\`),
          api.get(\`/communities/\${slug}/events\`).catch(() => [])
        ]);
        setCommunity(cData);
        setEvents(Array.isArray(eData) ? eData : []);
      } catch (err) {
        showToast('Davra topilmadi', 'error');
        navigate('/communities');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, navigate, showToast]);

  const toggleJoin = async () => {
    if (!user) {
      showToast('Tizimga kiring', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      if (community.isJoined) {
        await api.post(\`/communities/\${community.id}/leave\`);
        setCommunity(prev => ({ ...prev, isJoined: false, memberCount: prev.memberCount - 1 }));
        showToast('Davradan chiqdingiz', 'info');
      } else {
        await api.post(\`/communities/\${community.id}/join\`);
        setCommunity(prev => ({ ...prev, isJoined: true, memberCount: prev.memberCount + 1 }));
        showToast("Davraga qo'shildingiz", 'success');
      }
    } catch (err) {
      showToast('Xatolik yuz berdi', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container mt-8"><Skeleton.Card /></div>;
  if (!community) return null;

  return (
    <div className="community-detail">
      <div className="detail-cover">
        <div className="cover-bg" style={{ backgroundImage: \`url(\${community.coverImage || ''})\` }}></div>
        <div className="container cover-content">
          <span className="badge">{community.category}</span>
          <h1>{community.name}</h1>
          <p>{community.memberCount} a'zo • Yaratuvchi: {community.owner?.name || 'Admin'}</p>
          <button 
            className={\`btn \${community.isJoined ? 'btn-ghost' : 'btn-primary'} mt-4\`}
            onClick={toggleJoin}
            disabled={actionLoading}
            style={{ backgroundColor: community.isJoined ? 'white' : '' }}
          >
            {actionLoading ? '...' : community.isJoined ? 'Davradan chiqish' : "Davraga qo'shilish"}
          </button>
        </div>
      </div>

      <div className="container detail-content">
        <div className="main-col">
          <section className="about-section">
            <h2>Davra haqida</h2>
            <p>{community.description}</p>
          </section>

          <section className="events-section">
            <h2>Tadbirlar</h2>
            {events.length > 0 ? (
              events.map(event => <EventCard key={event.id} event={event} />)
            ) : (
              <p className="text-muted">Hozircha tadbirlar yo'q.</p>
            )}
          </section>
        </div>
        
        <div className="side-col">
          <section className="members-section">
            <h3>A'zolar</h3>
            <div className="members-grid">
              {(community.members || []).slice(0, 12).map((m, i) => (
                <div key={i} className="member-avatar" title={m.name}>
                  <img src={m.avatar || \`https://ui-avatars.com/api/?name=\${m.name}\`} alt={m.name} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
`,
  'src/pages/CommunityDetailPage.css': `
.mt-8 { margin-top: var(--space-8); }

.detail-cover {
  position: relative;
  height: 300px;
  display: flex;
  align-items: flex-end;
  color: var(--color-white);
  padding-bottom: var(--space-8);
}

.cover-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--color-indigo);
  background-size: cover;
  background-position: center;
  z-index: -2;
}

.detail-cover::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to top, rgba(15, 31, 51, 0.9), rgba(15, 31, 51, 0.3));
  z-index: -1;
}

.cover-content h1 {
  color: var(--color-white);
  margin-bottom: var(--space-2);
}

.badge {
  background-color: var(--color-turquoise);
  color: var(--color-white);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-4);
  display: inline-block;
}

.detail-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-8);
  padding-top: var(--space-8);
}

.about-section {
  background: var(--color-white);
  padding: var(--space-6);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-8);
}

.text-muted {
  color: var(--color-gray-500);
}

.members-section {
  background: var(--color-white);
  padding: var(--space-6);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.members-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
}
`,
  'src/pages/CreateCommunityPage.jsx': `
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './CreateCommunityPage.css';

const CATEGORIES = ['Texnologiya', "San'at", 'Sport', "Ta'lim", 'Biznes', "Sog'liq", 'Sayohat', 'Musiqa', 'Boshqa'];

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0],
    visibility: 'public'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      showToast("Barcha maydonlarni to'ldiring", 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/communities', formData);
      showToast("Davra muvaffaqiyatli yaratildi!", 'success');
      navigate(\`/communities/\${res.slug || res.id}\`);
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container create-community-page">
      <div className="form-container">
        <h1>Yangi davra yaratish</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Davra nomi</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Masalan: Toshkent Dasturchilari"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tavsif</label>
            <textarea 
              className="form-control" 
              rows="4"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Davra haqida qisqacha ma'lumot..."
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Kategoriya</label>
            <select 
              className="form-control"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Ko'rinishi</label>
            <select 
              className="form-control"
              value={formData.visibility}
              onChange={e => setFormData({...formData, visibility: e.target.value})}
            >
              <option value="public">Ochiq (hamma ko'ra oladi)</option>
              <option value="private">Yopiq (faqat a'zolar)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
            {loading ? 'Yaratilmoqda...' : 'Davra yaratish'}
          </button>
        </form>
      </div>
    </div>
  );
}
`,
  'src/pages/CreateCommunityPage.css': `
.create-community-page {
  padding-top: var(--space-12);
  display: flex;
  justify-content: center;
}

.form-container {
  background: var(--color-white);
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 600px;
}

.form-container h1 {
  text-align: center;
  margin-bottom: var(--space-6);
}

.w-100 { width: 100%; }
`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file].trim());
});
console.log('Generated successfully');
