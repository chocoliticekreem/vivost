import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from '../components/LegalPage';
import { LEGAL } from '../data/legal';

const PrivacyPolicy: React.FC = () => (
  <LegalPage title="Privacy Policy">
    <p>
      This policy explains how {LEGAL.legalEntity} ("we", "us") collects and uses personal data
      when you use {LEGAL.tradingName} (the "Site"), and your rights under the UK GDPR and the
      Data Protection Act 2018. We are the data controller for that processing.
    </p>

    <h3>Who we are</h3>
    <ul>
      <li><strong>Controller:</strong> {LEGAL.legalEntity}</li>
      <li><strong>Company number:</strong> {LEGAL.companyNumber}</li>
      <li><strong>Registered office:</strong> {LEGAL.registeredOffice}</li>
      <li><strong>ICO registration:</strong> {LEGAL.icoRegistration}</li>
      <li><strong>Data-protection contact:</strong> {LEGAL.privacyEmail}</li>
    </ul>

    <h3>What we collect</h3>
    <ul>
      <li><strong>Visitor data:</strong> IP address, device/browser information, and pages viewed, collected to operate and secure the Site.</li>
      <li><strong>Enquiry data:</strong> any information you submit through contact, report or enquiry forms.</li>
      <li><strong>Listing data:</strong> information shown in profiles/listings, including display names, locations, contact numbers, images and descriptions.</li>
      <li><strong>Consent records:</strong> your cookie choices and age confirmation.</li>
    </ul>

    <h3>How we use it and our lawful bases</h3>
    <ul>
      <li><strong>Operating the Site and displaying listings</strong> — legitimate interests, and/or contract where you hold an account.</li>
      <li><strong>Security, fraud and abuse prevention, and meeting our legal duties</strong> (including Online Safety Act obligations) — legal obligation and legitimate interests.</li>
      <li><strong>Non-essential cookies and analytics</strong> — your consent (see our <Link to="/cookies">Cookie Policy</Link>), which you may withdraw at any time.</li>
    </ul>

    <h3>Where listing data comes from</h3>
    <p>
      Some listing data may be obtained from sources other than the individual directly. If you are
      featured in a listing and want it corrected or removed, contact{' '}
      <strong>{LEGAL.takedownEmail}</strong> and we will action it — see "Your rights" below.
    </p>

    <h3>Who we share it with</h3>
    <p>
      We share personal data only with service providers that help us run the Site (for example
      hosting, analytics, email and payment providers), and with law enforcement or regulators where
      we are legally required to. We do not sell your personal data. Where a provider is outside the
      UK, transfers are protected by UK adequacy regulations or an International Data Transfer
      Agreement.
    </p>

    <h3>How long we keep it</h3>
    <p>
      We keep personal data only as long as needed for the purposes above or to meet legal
      obligations, after which it is deleted or anonymised. Consent and moderation records are kept
      for the period needed to demonstrate compliance.
    </p>

    <h3>Your rights</h3>
    <p>Under UK data-protection law you have the right to:</p>
    <ul>
      <li>access a copy of your personal data;</li>
      <li>have inaccurate data corrected (rectification);</li>
      <li>have your data erased ("right to be forgotten");</li>
      <li>restrict or object to our processing;</li>
      <li>data portability; and</li>
      <li>withdraw consent at any time where we rely on it.</li>
    </ul>
    <p>
      To exercise any of these, email <strong>{LEGAL.privacyEmail}</strong> (or{' '}
      <strong>{LEGAL.takedownEmail}</strong> for listing removals). We respond within one month.
    </p>

    <h3>Complaints</h3>
    <p>
      You can complain to the {LEGAL.ico.name} at{' '}
      <a href={LEGAL.ico.url} target="_blank" rel="noopener noreferrer">{LEGAL.ico.url}</a> or{' '}
      {LEGAL.ico.phone}. We would welcome the chance to resolve your concern first.
    </p>
  </LegalPage>
);

export default PrivacyPolicy;
