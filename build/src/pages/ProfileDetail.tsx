import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProfileById, getProfilesByCategory } from '../data';
import ProfileCard from '../components/ProfileCard';

const ProfileDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const profile = useMemo(() => (id ? getProfileById(id) : undefined), [id]);
  
  const similarProfiles = useMemo(() => {
    if (!profile) return [];
    return getProfilesByCategory(profile.categorySlug)
      .filter(p => p.id !== profile.id)
      .slice(0, 4);
  }, [profile]);

  if (!profile) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 className="card">Listing not found</h2>
        <Link to="/" style={{ color: 'var(--color-header-bg)' }}>Return to Home</Link>
      </div>
    );
  }

  const handleReport = () => {
    setShowReportConfirm(true);
  };

  try {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '20px', fontSize: '14px' }}>
          <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <Link to={`/search?category=${profile.categorySlug}`} style={{ color: '#666', textDecoration: 'none', textTransform: 'capitalize' }}>
            {profile.categorySlug}
          </Link>
          <span style={{ margin: '0 8px' }}>&gt;</span>
          <span style={{ fontWeight: 'bold' }}>{profile.name}</span>
        </nav>

        <div className="search-results-layout">
          <div className="results-area">
            {/* Gallery Placeholder */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '20px', height: '400px' }}>
              <div style={{ backgroundColor: profile.imageColor, borderRadius: 'var(--border-radius)' }} />
              <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '10px' }}>
                <div style={{ backgroundColor: profile.imageColor, opacity: 0.8, borderRadius: 'var(--border-radius)' }} />
                <div style={{ backgroundColor: profile.imageColor, opacity: 0.6, borderRadius: 'var(--border-radius)' }} />
              </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                <div>
                  <h1 style={{ margin: '0' }}>{profile.name}</h1>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>{profile.location} • {profile.categorySlug.toUpperCase()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-header-bg)' }}>£{profile.hourlyRate}</div>
                  <div style={{ fontSize: '14px', color: '#888' }}>per hour</div>
                </div>
              </div>

              <h3>About</h3>
              <p style={{ lineHeight: '1.6', color: '#444' }}>{profile.description}</p>

              <h3 style={{ marginTop: '30px' }}>Attributes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {profile.attributes.map((attr, idx) => (
                  <div key={idx} style={{ padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#888', display: 'block', textTransform: 'uppercase' }}>{attr.label}</span>
                    <span style={{ fontWeight: '640' }}>{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="filter-sidebar">
            <div className="card" style={{ position: 'sticky', top: '20px' }}>
              <button 
                className="btn-amber" 
                style={{ width: '100%', padding: '15px', fontSize: '16px', marginBottom: '10px' }}
                onClick={() => setShowContact(!showContact)}
              >
                {showContact ? '07700 900XXX' : 'Show contact details'}
              </button>
              
              <button 
                onClick={handleReport}
                style={{ width: '100%', background: 'none', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Report this listing
              </button>

              {showReportConfirm && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff4f4', border: '1px solid #ffcdd2', borderRadius: '4px', fontSize: '13px' }}>
                  <strong>Report received.</strong> Thank you for helping keep our community safe. We will review this profile shortly.
                </div>
              )}

              <div style={{ marginTop: '20px', fontSize: '13px', color: '#666' }}>
                <p>Status: <strong>{profile.availability}</strong></p>
                <p>Member since: Jan 2024</p>
              </div>
            </div>
          </aside>
        </div>

        {similarProfiles.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2>Similar profiles</h2>
            <div className="profile-grid">
              {similarProfiles.map(p => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error(`[ProfileDetail Error]: Failed to render profile ${id}`, error);
    return <div className="card">An error occurred while loading this profile.</div>;
  }
};

export default ProfileDetail;