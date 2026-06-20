import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL } from '../data/legal';

// Shared shell for the static legal/policy pages: a readable single-column
// card with a title, "last updated" line and consistent typography.
const LegalPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ maxWidth: '820px', margin: '0 auto', padding: '20px' }}>
    <nav style={{ marginBottom: '20px', fontSize: '14px' }}>
      <Link to="/" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>Home</Link>
      <span style={{ margin: '0 8px' }}>&gt;</span>
      <span style={{ fontWeight: 'bold' }}>{title}</span>
    </nav>
    <div className="card" style={{ lineHeight: 1.7, color: 'var(--text-2)' }}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '-8px' }}>Last updated: {LEGAL.lastUpdated}</p>
      {children}
    </div>
  </div>
);

export default LegalPage;
