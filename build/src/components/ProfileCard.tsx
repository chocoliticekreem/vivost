import React from 'react';
import { Link } from 'react-router-dom';
import { Profile } from '../data/profiles';

interface ProfileCardProps {
  profile: Profile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  try {
    const cover = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null;
    const locationLabel = profile.area ? `${profile.area}, ${profile.location}` : profile.location;
    return (
      <Link to={`/profile/${profile.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card profile-card">
          <div
            style={{
              position: 'relative',
              height: '200px',
              borderRadius: 'calc(var(--border-radius) - 4px)',
              marginBottom: '12px',
              overflow: 'hidden',
              backgroundColor: profile.imageColor,
            }}
          >
            {cover && (
              <img
                src={cover}
                alt={profile.name}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            {profile.verified && (
              <span
                style={{
                  position: 'absolute', top: '8px', left: '8px',
                  background: 'rgba(20,120,80,0.92)', color: '#fff',
                  fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                  borderRadius: '999px', letterSpacing: '0.02em',
                }}
              >
                ✓ ID Verified
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{profile.categorySlug.toUpperCase()} • {locationLabel}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-header-bg)' }}>£{profile.hourlyRate}</span>
              <span style={{ fontSize: '12px', display: 'block', color: '#888' }}>per hour</span>
            </div>
          </div>
        </div>
      </Link>
    );
  } catch (error) {
    console.error(`[ProfileCard Error]: Failed to render profile ${profile.id}`, error);
    return <div className="card">Error loading profile</div>;
  }
};

export default ProfileCard;
