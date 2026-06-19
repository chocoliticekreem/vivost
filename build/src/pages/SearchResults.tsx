import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { filterProfiles, sortProfiles, FilterOptions } from '../data/index';
import ProfileCard from '../components/ProfileCard';

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state for UI controls, initialized from URL
  const [filters, setFilters] = useState<FilterOptions>({
    categorySlug: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    keyword: searchParams.get('keyword') || searchParams.get('q') || '',
    maxRate: searchParams.get('maxRate') ? parseInt(searchParams.get('maxRate')!) : undefined
  });

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedProfiles = useMemo(() => {
    try {
      const filtered = filterProfiles(filters);
      return sortProfiles(filtered, sortOrder);
    } catch (error) {
      console.error("[SearchResults Error]: Filtering/Sorting failed", error);
      return [];
    }
  }, [filters, sortOrder]);

  const updateFilter = (key: keyof FilterOptions, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value === '' ? undefined : value };
    setFilters(newFilters);
    
    // Update URL to reflect current search state
    const newParams = new URLSearchParams();
    if (newFilters.keyword) newParams.set('keyword', newFilters.keyword);
    if (newFilters.categorySlug) newParams.set('category', newFilters.categorySlug);
    if (newFilters.location) newParams.set('location', newFilters.location);
    if (newFilters.maxRate) newParams.set('maxRate', newFilters.maxRate.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="search-results-page">
      <div className="search-results-layout">
        {/* Sidebar Filters */}
        <aside className="filter-sidebar card">
          <h3>Filters</h3>
          
          <div className="filter-group">
            <label>Category</label>
            <select 
              className="filter-input"
              value={filters.categorySlug || ''}
              onChange={(e) => updateFilter('categorySlug', e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <input 
              type="text" 
              className="filter-input"
              placeholder="Filter by city..."
              value={filters.location || ''}
              onChange={(e) => updateFilter('location', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Max Hourly Rate (£)</label>
            <input 
              type="number" 
              className="filter-input"
              value={filters.maxRate || ''}
              onChange={(e) => updateFilter('maxRate', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select 
              className="filter-input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Rate: low to high</option>
              <option value="desc">Rate: high to low</option>
            </select>
          </div>
        </aside>

        {/* Results Grid */}
        <section className="results-area">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>
              {filteredAndSortedProfiles.length} Results Found
            </h2>
            {filters.keyword && (
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                Searching for: "{filters.keyword}"
              </p>
            )}
          </div>

          <div className="profile-grid">
            {filteredAndSortedProfiles.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>

          {filteredAndSortedProfiles.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p>No profiles match your search criteria. Try adjusting the filters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SearchResults;