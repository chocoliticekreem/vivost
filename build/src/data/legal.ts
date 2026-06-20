// Single source of truth for the operator's legal/business identity and the
// contact routes referenced across the legal pages, footer and consent banner.
// Replace every [PLACEHOLDER] with real, verified details before going live —
// the Electronic Commerce (EC Directive) Regulations 2002 and the Companies Act
// require a genuine trading name, geographic address and company number to be
// shown, and UK GDPR requires a working data-subject contact.

export const LEGAL = {
  // Trading / legal identity ------------------------------------------------
  tradingName: 'Vivost',
  legalEntity: '[PLACEHOLDER — registered company name, e.g. Vivost Ltd]',
  companyNumber: '[PLACEHOLDER — Companies House number]',
  registeredOffice: '[PLACEHOLDER — registered office / geographic address, UK]',
  vatNumber: '[PLACEHOLDER — VAT number, if VAT-registered]',
  icoRegistration: '[PLACEHOLDER — ICO data-protection registration reference]',

  // Contact routes ----------------------------------------------------------
  generalEmail: '[PLACEHOLDER — e.g. hello@vivost.example]',
  privacyEmail: '[PLACEHOLDER — e.g. privacy@vivost.example]',
  // Where listed individuals send takedown / erasure requests.
  takedownEmail: '[PLACEHOLDER — e.g. removals@vivost.example]',

  // Dates -------------------------------------------------------------------
  lastUpdated: '20 June 2026',

  // External reporting bodies (real, verified UK contacts) ------------------
  ico: {
    name: "Information Commissioner's Office (ICO)",
    url: 'https://ico.org.uk/make-a-complaint/',
    phone: '0303 123 1113',
  },
  modernSlaveryHelpline: {
    name: 'Modern Slavery & Exploitation Helpline',
    url: 'https://www.modernslaveryhelpline.org/',
    phone: '0800 0121 700',
  },
  nca: {
    name: 'National Crime Agency',
    url: 'https://www.nationalcrimeagency.gov.uk/report-a-crime',
  },
} as const;
