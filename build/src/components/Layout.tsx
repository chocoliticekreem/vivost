import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { LEGAL } from '../data/legal';
import AgeGate from './AgeGate';
import CookieConsent, { openCookieSettings } from './CookieConsent';

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  padding: '14px 24px',
  background: 'rgba(10, 9, 16, 0.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  backdropFilter: 'blur(20px) saturate(160%)',
  borderBottom: '1px solid var(--glass-border)',
};

const Header: React.FC = () => (
  <header style={headerStyle}>
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', maxWidth: '1280px', margin: '0 auto' }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span className="gradient-text" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>Vivost</span>
      </Link>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <Link key={cat.id} to={`/search?category=${cat.slug}`} className="chip">
            {cat.name}
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="chip" style={{ cursor: 'default' }}>📍 London</span>
        <span style={{ fontSize: '18px', cursor: 'pointer', opacity: 0.85 }} role="img" aria-label="Account">👤</span>
        <button className="btn-amber">Post an ad</button>
      </div>
    </nav>
  </header>
);

const footerLink: React.CSSProperties = { color: 'var(--text-2)', textDecoration: 'none' };

const Footer: React.FC = () => (
  <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '48px 24px', marginTop: 'auto', background: 'rgba(8, 7, 13, 0.5)', WebkitBackdropFilter: 'blur(14px)', backdropFilter: 'blur(14px)' }}>
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '28px' }}>
      <div>
        <span className="gradient-text" style={{ fontSize: '20px', fontWeight: 800 }}>Vivost</span>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.7, marginTop: '10px' }}>
          A directory front-end. Strictly for adults aged 18 and over.
        </p>
      </div>
      <div>
        <h4 style={{ marginTop: 0 }}>Legal</h4>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', lineHeight: 2 }}>
          <li><Link to="/terms" style={footerLink}>Terms of Service</Link></li>
          <li><Link to="/privacy" style={footerLink}>Privacy Policy</Link></li>
          <li><Link to="/cookies" style={footerLink}>Cookie Policy</Link></li>
          <li>
            <button onClick={openCookieSettings}
              style={{ ...footerLink, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}>
              Cookie settings
            </button>
          </li>
        </ul>
      </div>
      <div>
        <h4 style={{ marginTop: 0 }}>Safety</h4>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', lineHeight: 2 }}>
          <li><Link to="/safety" style={footerLink}>Safety &amp; Reporting</Link></li>
          <li><Link to="/safety" style={footerLink}>Report a listing</Link></li>
          <li><Link to="/safety" style={footerLink}>Modern slavery &amp; trafficking</Link></li>
        </ul>
      </div>
      <div>
        <h4 style={{ marginTop: 0 }}>{LEGAL.tradingName}</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.7 }}>
          {LEGAL.legalEntity}<br />
          Company no. {LEGAL.companyNumber}<br />
          {LEGAL.registeredOffice}<br />
          {LEGAL.generalEmail}
        </p>
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)' }}>
          This site is strictly for adults aged 18 and over.
        </p>
      </div>
    </div>
  </footer>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AgeGate />
      <CookieConsent />
      <Header />
      <main style={{ flex: 1, padding: '24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
