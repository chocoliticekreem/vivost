import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProfileById, getProfilesByCategory } from '../data';
import ProfileCard from '../components/ProfileCard';

const ProfileDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showReportForm, setShowReportForm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [reportReason, setReportReason] = useState('');
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

  const handleSubmitReport = () => {
    if (!reportReason) return;
    setShowReportForm(false);
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
            {/* Photo gallery */}
            {profile.photos && profile.photos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '20px', height: '400px' }}>
                <img
                  src={profile.photos[0]}
                  alt={profile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--border-radius)' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                />
                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '10px' }}>
                  {[profile.photos[1], profile.photos[2]].map((src, i) => (
                    src ? (
                      <img
                        key={i}
                        src={src}
                        alt={`${profile.name} ${i + 2}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--border-radius)' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                      />
                    ) : (
                      <div key={i} style={{ backgroundColor: profile.imageColor, borderRadius: 'var(--border-radius)' }} />
                    )
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: profile.imageColor, height: '300px', borderRadius: 'var(--border-radius)', marginBottom: '20px' }} />
            )}

            {/* Thumbnail strip for remaining photos */}
            {profile.photos && profile.photos.length > 3 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
                {profile.photos.slice(3).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${profile.name} thumb ${i + 4}`}
                    style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
            )}

            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                <div>
                  <h1 style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {profile.name}
                    {profile.verified && (
                      <span style={{ background: 'rgba(20,120,80,0.12)', color: '#147850', fontSize: '13px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>✓ ID Verified</span>
                    )}
                  </h1>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                    {(profile.area ? `${profile.area}, ` : '') + profile.location} • {profile.categorySlug.toUpperCase()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-header-bg)' }}>£{profile.hourlyRate}</div>
                  <div style={{ fontSize: '14px', color: '#888' }}>per hour</div>
                </div>
              </div>

              <h3>About</h3>
              <p style={{ lineHeight: '1.6', color: '#444' }}>{profile.description}</p>

              <h3 style={{ marginTop: '30px' }}>Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {profile.attributes.map((attr, idx) => (
                  <div key={idx} style={{ padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#888', display: 'block', textTransform: 'uppercase' }}>{attr.label}</span>
                    <span style={{ fontWeight: '640' }}>{attr.value}</span>
                  </div>
                ))}
              </div>

              {profile.services && profile.services.length > 0 && (
                <>
                  <h3 style={{ marginTop: '30px' }}>Services</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {profile.services.map((svc, idx) => (
                      <span key={idx} style={{ background: '#f0f0f5', borderRadius: '999px', padding: '5px 12px', fontSize: '13px', color: '#444' }}>{svc}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="filter-sidebar">
            <div className="card" style={{ position: 'sticky', top: '20px' }}>
              <button
                className="btn-amber"
                style={{ width: '100%', padding: '15px', fontSize: '16px', marginBottom: '10px' }}
                onClick={() => setShowContact(!showContact)}
                disabled={!profile.phone}
              >
                {profile.phone
                  ? (showContact ? profile.phone : 'Show contact details')
                  : 'No contact number listed'}
              </button>

              {showContact && profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  style={{ display: 'block', textAlign: 'center', textDecoration: 'none', color: 'var(--color-header-bg)', fontSize: '14px', marginBottom: '10px' }}
                >
                  Tap to call
                </a>
              )}

              <button
                onClick={() => setShowReportForm(v => !v)}
                style={{ width: '100%', background: 'none', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Report this listing
              </button>

              {showReportForm && !showReportConfirm && (
                <div style={{ marginTop: '15px', padding: '12px', border: '1px solid #eee', borderRadius: '4px', fontSize: '13px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Why are you reporting this listing?</label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }}
                  >
                    <option value="">Select a reason…</option>
                    <option value="underage">May involve someone under 18</option>
                    <option value="trafficking">Trafficking / coercion / exploitation</option>
                    <option value="illegal">Illegal content or activity</option>
                    <option value="fake">Fake, scam or fraudulent listing</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    className="btn-amber"
                    style={{ width: '100%' }}
                    onClick={handleSubmitReport}
                    disabled={!reportReason}
                  >
                    Submit report
                  </button>
                  <p style={{ marginTop: '10px', marginBottom: 0, color: '#666' }}>
                    Someone in immediate danger? Call 999. Suspect trafficking?{' '}
                    <Link to="/safety">Safety &amp; Reporting</Link>.
                  </p>
                </div>
              )}

              {showReportConfirm && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff4f4', border: '1px solid #ffcdd2', borderRadius: '4px', fontSize: '13px' }}>
                  <strong>Report received.</strong> Thank you for helping keep our community safe. We review reports and remove illegal content promptly.
                </div>
              )}

              <div style={{ marginTop: '20px', fontSize: '13px', color: '#666' }}>
                <p>Availability: <strong>{profile.availability}</strong></p>
                {profile.verified && <p style={{ color: '#147850' }}>✓ ID Verified advertiser</p>}
                {profile.sourceUrl && (
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    <a href={profile.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#999' }}>Original listing ↗</a>
                  </p>
                )}
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