import React, { useState, useEffect, useRef } from 'react';

// COMPLIANCE NOTE: this is self-declaration age verification. Under the Online
// Safety Act 2023, a service showing adult/sexualised content to UK users must
// use "highly effective age assurance" (HEAA) — Ofcom explicitly rules out a
// self-declared "I am 18" checkbox. Before launching with real adult content,
// replace this with a HEAA provider (e.g. facial age estimation, photo-ID match,
// open banking, credit-card or MNO check — Yoti, Persona, VerifyMy, etc.).

const AgeGate: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const enterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const confirmed = localStorage.getItem('age-confirmed');
    if (!confirmed) {
      setIsVisible(true);
    }
  }, []);

  // Move focus into the modal so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (isVisible) {
      enterButtonRef.current?.focus();
    }
  }, [isVisible]);

  const handleConfirm = () => {
    try {
      localStorage.setItem('age-confirmed', 'true');
      setIsVisible(false);
    } catch (e) {
      console.error("[AgeGate Error]: Failed to save to localStorage", e);
    }
  };

  if (!isVisible) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.82)',
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    color: 'white',
    textAlign: 'center',
    padding: '20px'
  };

  return (
    <div style={overlayStyle}>
      <div
        className="card"
        style={{ color: 'var(--text-1)', maxWidth: '400px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
      >
        <h2 id="age-gate-title">Age Verification</h2>
        <p id="age-gate-desc">This website contains adult content and is restricted to persons aged 18 years and older.</p>
        <p>Please confirm you are of legal age to continue.</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button ref={enterButtonRef} className="btn-amber" onClick={handleConfirm}>I am 18 or older — Enter</button>
          <button 
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--glass-border)', color: 'var(--text-2)', background: 'transparent' }}
            onClick={() => window.location.href = 'https://www.google.com'}
          >
            Leave
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '16px', marginBottom: 0 }}>
          By entering you confirm you are 18+ and agree to our{' '}
          <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default AgeGate;