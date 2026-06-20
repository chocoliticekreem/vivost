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
        <article className="profile-card">
          <div className="profile-media" style={{ backgroundColor: profile.imageColor }}>
            {cover && (
              <img
                src={cover}
                alt={profile.name}
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="profile-scrim" />

            <div className="profile-topbar">
              <span className="badge badge-glass">
                <span className="online-dot" /> Online
              </span>
              {profile.verified && <span className="badge badge-verified">✓ Verified</span>}
            </div>

            <div className="profile-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</h3>
                  <p className="meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.categorySlug.toUpperCase()} • {locationLabel}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className="rate">£{profile.hourlyRate}</span>
                  <br />
                  <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>per hour</small>
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  } catch (error) {
    console.error(`[ProfileCard Error]: Failed to render profile ${profile.id}`, error);
    return <div className="card">Error loading profile</div>;
  }
};

export default ProfileCard;
