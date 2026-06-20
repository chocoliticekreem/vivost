import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from '../components/LegalPage';
import { LEGAL } from '../data/legal';

const Safety: React.FC = () => (
  <LegalPage title="Safety & Reporting">
    <p>
      Your safety matters. This page explains how to report a problem and how to get help if you or
      someone else may be at risk.
    </p>

    <h3>Report a listing</h3>
    <p>
      Every profile has a <strong>"Report this listing"</strong> button. Use it to flag anything
      illegal, suspicious or harmful — including content that may involve someone under 18, coercion
      or trafficking. We review reports and remove illegal content promptly.
    </p>

    <h3>If someone may be in danger</h3>
    <p>
      If you believe someone is in immediate danger, call <strong>999</strong>.
    </p>

    <h3>Modern slavery and trafficking</h3>
    <p>
      If you suspect human trafficking, modern slavery or sexual exploitation, please report it:
    </p>
    <ul>
      <li>
        <strong>{LEGAL.modernSlaveryHelpline.name}:</strong>{' '}
        <a href={`tel:${LEGAL.modernSlaveryHelpline.phone.replace(/\s/g, '')}`}>{LEGAL.modernSlaveryHelpline.phone}</a>{' '}
        (<a href={LEGAL.modernSlaveryHelpline.url} target="_blank" rel="noopener noreferrer">website</a>)
      </li>
      <li>
        <strong>{LEGAL.nca.name}:</strong>{' '}
        <a href={LEGAL.nca.url} target="_blank" rel="noopener noreferrer">report online</a>
      </li>
    </ul>

    <h3>Staying safe online</h3>
    <ul>
      <li>Never send money, deposits or gift cards to someone you have not met.</li>
      <li>Be cautious of listings that pressure you or seem too good to be true.</li>
      <li>Keep personal and financial details private.</li>
    </ul>

    <h3>Contact us</h3>
    <p>
      For anything else, email <strong>{LEGAL.generalEmail}</strong>. To remove your own
      information, see our <Link to="/privacy">Privacy Policy</Link>.
    </p>
  </LegalPage>
);

export default Safety;
