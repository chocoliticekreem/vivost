import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from '../components/LegalPage';
import { LEGAL } from '../data/legal';

const Terms: React.FC = () => (
  <LegalPage title="Terms of Service">
    <p>
      These terms govern your use of {LEGAL.tradingName} (the "Site"), operated by {LEGAL.legalEntity}.
      By using the Site you agree to them. If you do not agree, do not use the Site.
    </p>

    <h3>1. Adults only (18+)</h3>
    <p>
      The Site is strictly for adults aged 18 or over. You must complete age verification to use it.
      It is an offence to use the Site if you are under 18, and we operate age assurance to keep
      under-18s out.
    </p>

    <h3>2. Nature of listings</h3>
    <p>
      Listings advertise <strong>time, companionship and the advertiser's availability only</strong>.
      Any fee shown is for an advertiser's time and company. Nothing on the Site is an offer or
      agreement to provide sexual services for payment, and listings must not advertise such
      services. Advertisers act independently; we do not employ, control or direct them and are not
      party to any arrangement made between users.
    </p>

    <h3>3. Prohibited content and conduct</h3>
    <p>You must not use the Site to post, request or facilitate:</p>
    <ul>
      <li>any content involving a person under 18, or content that sexualises a minor;</li>
      <li>human trafficking, modern slavery, coercion or any non-consenting person;</li>
      <li>explicit advertising of sexual services for payment;</li>
      <li>any other illegal content or activity.</li>
    </ul>
    <p>
      Advertisers must be 18+, must have the right to use any images they upload, and must consent to
      their listing. We may require identity and age verification of advertisers.
    </p>

    <h3>4. Moderation, reporting and takedown</h3>
    <p>
      We assess the risk of illegal content and operate reporting and takedown processes in line with
      our duties under the Online Safety Act 2023. Anyone can report a listing using the
      "Report this listing" button, or via our <Link to="/safety">Safety &amp; Reporting</Link> page.
      We remove illegal content promptly once we are aware of it and may suspend or remove accounts
      that breach these terms. We cooperate with law enforcement and report suspected exploitation.
    </p>

    <h3>5. Removal of your information</h3>
    <p>
      If you appear in a listing and want it removed, contact <strong>{LEGAL.takedownEmail}</strong>.
      See our <Link to="/privacy">Privacy Policy</Link> for your data rights.
    </p>

    <h3>6. No warranty; limitation of liability</h3>
    <p>
      The Site is provided "as is". We do not verify the accuracy of every listing and are not liable
      for dealings between users, to the fullest extent permitted by law. Nothing in these terms
      limits liability that cannot be limited by law.
    </p>

    <h3>7. Governing law</h3>
    <p>These terms are governed by the law of England and Wales.</p>
  </LegalPage>
);

export default Terms;
