import React from 'react';
import { Link } from 'react-router-dom';
import { Profile } from '../data/profiles';

interface ProfileCardProps {
  profile: Profile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  try {
    return (
      <Link to={`/profile/${profile.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card profile-card">
          <div 
            style={{ 
              backgroundColor: profile.imageColor, 
              height: '200px', 
              borderRadius: 'calc(var(--border-radius) - 4px)',
              marginBottom: '12px'
            }} 
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{profile.name}</h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{profile.categorySlug.toUpperCase()} • {profile.location}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
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