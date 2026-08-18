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
