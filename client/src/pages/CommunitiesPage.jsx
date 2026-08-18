import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from '../components/SearchBar';
import CircleCard from '../components/CircleCard';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import './CommunitiesPage.css';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Hammasi');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular'); // popular, newest

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (data) setCategories(data);
      } catch (err) {
        console.error('Categories fetch error:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch circles with Supabase
  useEffect(() => {
    async function fetchCircles() {
      setLoading(true);
      try {
        let query = supabase
          .from('circles')
          .select('*, categories(name), profiles!creator_id(full_name)')
          .eq('is_hidden', false)
          .eq('is_archived', false);

        if (selectedCategory !== 'Hammasi') {
          const matchedCat = categories.find(c => c.name === selectedCategory);
          if (matchedCat) {
            query = query.eq('category_id', matchedCat.id);
          }
        }

        if (search.trim()) {
          query = query.ilike('name', `%${search.trim()}%`);
        }

        if (sort === 'popular') {
          query = query.order('member_count', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        setCircles(data || []);
      } catch (err) {
        console.error('Circles fetch error:', err);
        setCircles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCircles();
  }, [selectedCategory, search, sort, categories]);

  return (
    <div className="communities-page container animate-fade-in">
      {/* Page Header */}
      <div className="communities-header flex justify-between items-end mb-8 animate-slide-up">
        <div>
          <span className="badge badge-accent mb-2">🌐 Hamjamiyatlar</span>
          <h1 className="text-4xl font-extrabold">Barcha Davralar</h1>
          <p className="text-muted mt-1">Qiziqishingizga mos davrani toping yoki o'z davrangizni oching.</p>
        </div>

        {user && (
          <Link to="/communities/new" className="btn btn-primary btn-lg">
            + Yangi Davra Yaratish
          </Link>
        )}
      </div>

      {/* Controls: Search & Sort */}
      <div className="communities-controls-bar flex justify-between items-center gap-4 mb-6">
        <div className="search-flex-item">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Davralarni qidirish..."
          />
        </div>

        <div className="sort-controls flex items-center gap-2">
          <span className="text-xs text-muted font-semibold">Saralash:</span>
          <button
            className={`btn btn-sm ${sort === 'popular' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSort('popular')}
          >
            🔥 Mashhur
          </button>
          <button
            className={`btn btn-sm ${sort === 'newest' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSort('newest')}
          >
            ✨ Eng yangi
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="category-pills-scroll mb-8">
        <button
          className={`category-pill ${selectedCategory === 'Hammasi' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('Hammasi')}
        >
          Hammasi
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.name ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            {cat.icon || '🏷️'} {cat.name}
          </button>
        ))}
      </div>

      {/* Expandable Hover Grid */}
      {loading ? (
        <div className="circles-masonry-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      ) : circles.length > 0 ? (
        <div className="circles-masonry-grid">
          {circles.map((circle) => (
            <CircleCard key={circle.id} circle={circle} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Davralar topilmadi"
          description="Siz qidirayotgan mezonlarga mos hamjamiyat mavjud emas."
        />
      )}
    </div>
  );
}
