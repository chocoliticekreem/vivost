import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import AgeGate from './AgeGate';

const Header: React.FC = () => (
  <header style={{ backgroundColor: 'var(--color-header-bg)', color: 'white', padding: '10px 20px' }}>
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Vivost</Link>
      </div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {CATEGORIES.map(cat => (
          <Link key={cat.id} to={`/search?category=${cat.slug}`} style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            {cat.name}
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '12px', border: '1px solid #444', padding: '4px 8px' }}>Location: London</span>
        <div style={{ fontSize: '20px', cursor: 'pointer' }}>👤</div>
        <button className="btn-amber">Post an ad</button>
      </div>
    </nav>
  </header>
);

const Footer: React.FC = () => (
  <footer style={{ backgroundColor: '#fff', borderTop: '1px solid #ddd', padding: '40px 20px', marginTop: 'auto' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
      <div>
        <h4>Company</h4>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px' }}>
          <li>About Us</li>
          <li>Terms of Service</li>
          <li>Privacy Policy</li>
        </ul>
      </div>
      <div>
        <h4>Safety</h4>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px' }}>
          <li><a href="#">Safety Advice</a></li>
          <li><a href="#">Report a listing</a></li>
          <li><a href="#">Scam Awareness</a></li>
        </ul>
      </div>
      <div>
        <h4>Legal</h4>
        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#d32f2f' }}>
          18 U.S.C. 2257 Recordkeeping Requirements Compliance Statement. 
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
      <Header />
      <main style={{ flex: 1, padding: '20px' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;