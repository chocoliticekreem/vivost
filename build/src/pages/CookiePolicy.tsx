import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from '../components/LegalPage';
import { openCookieSettings } from '../components/CookieConsent';

const td: React.CSSProperties = { border: '1px solid #eee', padding: '8px 10px', textAlign: 'left', verticalAlign: 'top' };

const CookiePolicy: React.FC = () => (
  <LegalPage title="Cookie Policy">
    <p>
      This policy explains the cookies and similar storage technologies (including browser local
      storage) we use, and how you can control them. Under the Privacy and Electronic Communications
      Regulations (PECR) we may only set non-essential technologies with your consent.
    </p>

    <h3>Technologies we use</h3>
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '14px', marginTop: '10px' }}>
      <thead>
        <tr>
          <th style={td}>Name</th>
          <th style={td}>Category</th>
          <th style={td}>Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={td}>age-confirmed</td>
          <td style={td}>Strictly necessary</td>
          <td style={td}>Remembers your age confirmation so the age screen is not shown repeatedly. Set without consent (essential).</td>
        </tr>
        <tr>
          <td style={td}>cookie-consent</td>
          <td style={td}>Strictly necessary</td>
          <td style={td}>Stores your cookie choices so we can honour them. Set without consent (essential).</td>
        </tr>
        <tr>
          <td style={td}>Analytics</td>
          <td style={td}>Statistical</td>
          <td style={td}>First-party measurement of how the Site is used. Only enabled if you allow it.</td>
        </tr>
        <tr>
          <td style={td}>Advertising</td>
          <td style={td}>Marketing</td>
          <td style={td}>Used to measure or personalise advertising. Only set after you opt in; off by default.</td>
        </tr>
      </tbody>
    </table>

    <h3>Managing your choices</h3>
    <p>
      You can change or withdraw your consent at any time. This is as easy as giving it.
    </p>
    <p>
      <button className="btn-amber" onClick={openCookieSettings}>Cookie settings</button>
    </p>
    <p>
      You can also block or delete cookies in your browser settings, though some essential features
      may stop working. For more on how we handle data, see our <Link to="/privacy">Privacy Policy</Link>.
    </p>
  </LegalPage>
);

export default CookiePolicy;
