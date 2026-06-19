import React, { useState, useEffect, useRef } from 'react';

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
    backgroundColor: 'rgba(0,0,0,0.9)',
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
        style={{ color: '#333', maxWidth: '400px' }}
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
            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc' }}
            onClick={() => window.location.href = 'https://www.google.com'}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeGate;