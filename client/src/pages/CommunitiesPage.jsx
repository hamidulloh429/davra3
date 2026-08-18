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
        if (category !== 'Hammasi') url += `category=${encodeURIComponent(category)}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        url += `sort=${sort}`;
        
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
