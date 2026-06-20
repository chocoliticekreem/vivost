import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ProfileDetail from './pages/ProfileDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Terms from './pages/Terms';
import Safety from './pages/Safety';

const App: React.FC = () => {
  try {
    return (
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/profile/:id" element={<ProfileDetail />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[App Component Error]: Failed to render. Details: ${errorMessage}`);
    return <div>An error occurred while loading the application. Check console for details.</div>;
  }
};

export default App;