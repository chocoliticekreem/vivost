import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// PECR / ICO-compliant consent: non-essential categories are opt-in and off by
// default, "Reject all" sits with equal prominence to "Accept all", choices are
// granular, and the decision (plus a timestamp) is recorded so we can honour and
// demonstrate it. Re-openable any time via the footer / Cookie Policy.

const STORAGE_KEY = 'cookie-consent';
const OPEN_EVENT = 'open-cookie-settings';

export interface ConsentChoices {
  statistical: boolean;
  marketing: boolean;
  timestamp: string;
}

export function getConsent(): ConsentChoices | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentChoices) : null;
  } catch {
    return null;
  }
}

// Called from the Cookie Policy page / footer to re-open the preferences panel.
export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [statistical, setStatistical] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
    const reopen = () => {
      const current = getConsent();
      setStatistical(current?.statistical ?? false);
      setMarketing(current?.marketing ?? false);
      setShowDetail(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const save = (choices: { statistical: boolean; marketing: boolean }) => {
    try {
      const record: ConsentChoices = { ...choices, timestamp: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      console.error('[CookieConsent Error]: Failed to save consent', e);
    }
    setVisible(false);
    setShowDetail(false);
  };

  if (!visible) return null;

  const barStyle: React.CSSProperties = {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9998,
    background: '#fff', borderTop: '2px solid var(--color-header-bg)',
    boxShadow: '0 -2px 12px rgba(0,0,0,0.15)', padding: '20px',
  };
  const equalBtn: React.CSSProperties = {
    padding: '10px 18px', borderRadius: '4px', border: '1px solid var(--color-header-bg)',
    background: '#fff', color: 'var(--color-header-bg)', fontWeight: 'bold', cursor: 'pointer',
  };

  return (
    <div style={barStyle} role="dialog" aria-label="Cookie consent">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
          We use essential cookies to make the site work. With your consent we also use statistical
          and marketing technologies. You can accept, reject or choose. See our{' '}
          <Link to="/cookies">Cookie Policy</Link>.
        </p>

        {showDetail && (
          <div style={{ margin: '12px 0', fontSize: '14px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>
              <input type="checkbox" checked disabled /> Strictly necessary (always on)
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" checked={statistical} onChange={e => setStatistical(e.target.checked)} /> Statistical (first-party analytics)
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} /> Marketing
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={equalBtn} onClick={() => save({ statistical: false, marketing: false })}>
            Reject all
          </button>
          <button style={{ ...equalBtn, background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: '#000' }}
            onClick={() => save({ statistical: true, marketing: true })}>
            Accept all
          </button>
          {showDetail ? (
            <button style={equalBtn} onClick={() => save({ statistical, marketing })}>
              Save choices
            </button>
          ) : (
            <button style={{ ...equalBtn, border: '1px solid #ccc', color: '#555' }} onClick={() => setShowDetail(true)}>
              Manage preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
