import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { PROFILES } from '../data/profiles';
import ProfileCard from '../components/ProfileCard';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ keyword: '', category: '', location: '' });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.keyword) params.append('keyword', search.keyword);
    if (search.category) params.append('category', search.category);
    if (search.location) params.append('location', search.location);
    navigate(`/search?${params.toString()}`);
  };

  const featuredProfiles = PROFILES.slice(0, 8);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section card">
        <h1 style={{ marginTop: 0 }}>Find your ideal service provider</h1>
        <form onSubmit={handleSearch} className="search-panel" aria-label="Search providers">
          <input
            type="text"
            placeholder="Keyword (e.g. Friendly)"
            aria-label="Keyword"
            className="search-input"
            value={search.keyword}
            onChange={(e) => setSearch({...search, keyword: e.target.value})}
          />
          <select
            className="search-input"
            aria-label="Category"
            value={search.category}
            onChange={(e) => setSearch({...search, category: e.target.value})}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Location"
            aria-label="Location"
            className="search-input"
            value={search.location}
            onChange={(e) => setSearch({...search, location: e.target.value})}
          />
          <button type="submit" className="btn-amber" style={{ height: '45px' }}>Search</button>
        </form>
      </section>

      {/* Category Tiles */}
      <section style={{ margin: '40px 0' }}>
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <Link key={cat.id} to={`/search?category=${cat.slug}`} className="category-tile">
              <strong>{cat.name}</strong>
              <span style={{ fontSize: '12px', display: 'block', opacity: 0.8 }}>{cat.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Grid */}
      <section>
        <h2>Featured</h2>
        <div className="profile-grid">
          {featuredProfiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;