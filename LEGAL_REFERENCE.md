# Vivost — UK Legal & Regulatory Reference

**Last updated: 20 June 2026**

A working reference for every UK law and regulation that governs Vivost as it expands from an adult-services / escort directory into a full platform (accounts, in-platform messaging, payments, ID / age verification, advertiser analytics, AI scam detection). Consulted constantly during development.

---

## ⚠️ DISCLAIMER

This is a **researched internal reference, not legal advice**. Every entry is cited to a primary or authoritative source (legislation.gov.uk, ICO, Ofcom, gov.uk, CPS), but legislation is amended frequently and its application to a specific business model is fact-sensitive. **Before launch, and before any feature touching payments, ID/age verification, or sexual-services content, engage (1) a specialist UK solicitor with criminal / online-safety experience and (2) a qualified Data Protection Officer.** Several items below carry criminal liability for operators personally — do not treat this document as a substitute for advice.

---

## 🚨 TOP RISKS / MUST-DO BEFORE LAUNCH

These are the existential or near-existential items. Resolve each with a solicitor before going live.

| # | Risk | Why it's existential | Status |
|---|------|----------------------|--------|
| 1 | **Sexual Offences Act 2003 ss.52/53** — causing/inciting or controlling prostitution "for gain" (7 yrs). **No platform safe-harbour.** Charging fees / taking a cut directly increases exposure. | Operators can be prosecuted personally. The business model itself is the risk. | **Live now.** Mitigate: time/companionship-only framing, no explicit sexual-services ads, advertiser ID + age verification, robust moderation. Get legal sign-off on the framing. |
| 2 | **Proceeds of Crime Act 2002** — ss.52/53 are "lifestyle offences" → confiscation of platform revenue; plus money-laundering exposure (ss.327-329). | Profits from the platform could be confiscated; directors personally exposed. | **Live now.** Flows from Risk 1. |
| 3 | **"Pimping website" criminalisation** — an amendment (NC1/NC2, Champion/Antoniazzi) to criminalise enabling/profiting from another's prostitution online, with platform turnover as an *aggravating factor* and a *new enforcement body*. | Would criminalise the core model outright. | **NOT yet law** — was *not adopted* into the Crime and Policing Act 2026. Being actively pursued via Private Members' Bills / future legislation. **Monitor continuously.** See §7. |
| 4 | **Online Safety Act 2023 — Highly Effective Age Assurance (HEAA).** "I am 18" checkboxes are illegal as the sole gate. Deadlines already passed (16/17 Mar 2025 illegal-content; 25 Jul 2025 HEAA). | Ofcom can fine up to £18m / 10% global turnover and seek UK access-blocking. We are already past the deadline. | **Overdue — implement immediately.** See §1. |
| 5 | **UK GDPR Article 9 + DPIA.** All core platform data is special-category (sex life / orientation). Need an Art 6 basis **and** an Art 9 condition, plus a mandatory DPIA before processing. | Higher-tier fines £17.5m / 4%; processing is unlawful without the Art 9 condition in place. | **Do before any personal data is processed.** See §2. |

---

## Table of Contents

1. [Online Safety Act 2023](#1-online-safety-act-2023)
2. [UK GDPR + Data Protection Act 2018](#2-uk-gdpr--data-protection-act-2018)
3. [PECR + Data (Use and Access) Act 2025](#3-pecr--data-use-and-access-act-2025)
4. [Investigatory Powers Act 2016](#4-investigatory-powers-act-2016)
5. [Sexual Offences Act 2003](#5-sexual-offences-act-2003)
6. [Proceeds of Crime Act 2002](#6-proceeds-of-crime-act-2002)
7. [Crime and Policing Act 2026 + "Pimping Website" Risk](#7-crime-and-policing-act-2026--pimping-website-risk)
8. [Modern Slavery Act 2015](#8-modern-slavery-act-2015)
9. [E-Commerce, Consumer & Companies Disclosure Rules](#9-e-commerce-consumer--companies-disclosure-rules)
10. [Payment / Card-Scheme Rules](#10-payment--card-scheme-rules)

---

## 1. ONLINE SAFETY ACT 2023

Regulated by **Ofcom**. Vivost is a "user-to-user" and (because it carries adult content) a pornography-relevant service, so multiple duties apply.

### 1.1 Highly Effective Age Assurance (HEAA)

**(a) What it requires.** Services that allow pornographic or adult content must use age assurance that is "highly effective" at determining whether a user is a child. Ofcom states explicitly that **self-declaration ("I am 18" checkbox) and online payments that don't require the payer to be 18 are NOT highly effective.** Methods Ofcom accepts as *capable* of being highly effective:
- Photo-ID matching
- Facial age estimation
- Open banking
- Credit-card checks
- Mobile-network-operator (MNO) age checks
- Digital identity services / wallets
- Email-based age estimation

**(b) What it means for us.** A real age-assurance step (not a checkbox) must gate access to adult content for **viewers**, and feeds naturally into advertiser ID + age verification. Build it as a pluggable provider integration (see Verification & Payments task). We are already past the deadline, so this is remediation, not greenfield.

**(c) Penalty / risk.** Up to **£18 million or 10% of qualifying worldwide revenue**, whichever is greater, plus court-ordered business-disruption measures (access-blocking, withdrawal of payment/advertising services). See §1.4.

**(d) Citations.**
- Act: https://www.legislation.gov.uk/ukpga/2023/50
- Ofcom — age checks to protect children online: https://www.ofcom.org.uk/online-safety/protecting-children/age-checks-to-protect-children-online

> **Verified deadlines (corrected):** Illegal-content **risk-assessment** deadline was **16 March 2025**; illegal-content **safety duties** became enforceable **17 March 2025**. All in-scope pornography services had to have HEAA in place by **25 July 2025**. Ofcom issued finalised Part 5 HEAA guidance on **14 January 2026** — that January 2026 guidance is the current set as of today.

### 1.2 Illegal-Content Duties

**(a) What it requires.** Carry out an **illegal-content risk assessment**; operate systems to **report and take down** illegal content; provide **content-reporting and complaints** mechanisms; set clear **terms of service** addressing illegal content and enforce them consistently. **Priority offences** include **sexual exploitation / human trafficking AND fraud** (also terrorism, CSAM, hate offences, etc.).

**(b) What it means for us.** Our planned **AI scam-detection** system is *positive evidence of compliance* with the fraud-related illegal-content duty — document it in the risk assessment. Trafficking indicators must be part of moderation (ties to §8). Maintain a documented risk assessment, takedown workflow, and reporting routes.

**(c) Penalty / risk.** Same as §1.4.

**(d) Citations.**
- Ofcom — Protecting people from illegal harms online (statement & duties): https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/statement-protecting-people-from-illegal-harms-online

### 1.3 Terms of Service Duty

**(a) What it requires.** Clear, accessible terms covering how illegal content and (for some services) harmful content is handled, with consistent enforcement.

**(b) What it means for us.** ToS must be drafted to OSA standard, versioned, and surfaced at signup.

**(c)/(d)** As above.

### 1.4 Penalties & Enforcement

**(a) What it requires / risk.** Up to **£18 million or 10% of qualifying worldwide revenue** (whichever greater); senior-manager liability for certain failures; court-ordered **business-disruption / access-blocking** in the most serious cases.

**(d) Citations.**
- Ofcom enforcement guidance (PDF): https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/online-safety-enforcement-guidance.pdf
- Ofcom roadmap to regulation: https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/roadmap-to-regulation

---

## 2. UK GDPR + DATA PROTECTION ACT 2018

> **Foundational principle for Vivost:** treat **all** core platform data as **special-category data**. Membership of / interaction with an adult-services platform reveals "data concerning a natural person's sex life or sexual orientation" (Art 9). This removes the small-organisation ROPA exemption (§2.7) and triggers a mandatory DPIA (§2.3).

### 2.1 Article 9 — Special-Category Data (the core constraint)

**(a) What it requires.** Art 9(1) prohibits processing special-category data unless an Art 9(2) condition applies. You always need **both** an Art 6 lawful basis **and** an Art 9 condition. Relevant conditions:
- **Art 9(2)(a) — explicit consent** (for routine platform data).
- **Art 9(2)(g) — substantial public interest**, on the basis of UK law, which routes to **DPA 2018 Schedule 1** (see §2.2) — the basis for **scam / fraud monitoring** without consent.

**(b) What it means for us.** Two distinct legal pathways: explicit consent for ordinary account/profile/messaging processing; substantial-public-interest + DPA Sch 1 para 10 ("preventing/detecting unlawful acts") + an Appropriate Policy Document for the AI scam-detection monitoring (which can't rely on consent because consent would prejudice the purpose). Map every processing activity to one path or the other in the ROPA.

**(c) Penalty / risk.** Higher tier — see §2.8. Processing special-category data without a valid Art 9 condition is **unlawful processing**.

**(d) Citations.**
- UK GDPR Art 9: https://www.legislation.gov.uk/eur/2016/679/article/9
- ICO — special category data: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/
- ICO — substantial public interest conditions: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-are-the-substantial-public-interest-conditions/

### 2.2 DPA 2018 Schedule 1 — "Preventing/Detecting Unlawful Acts" + Appropriate Policy Document

**(a) What it requires.** Sch 1 Part 2 **para 10** ("preventing or detecting unlawful acts") lets you process special-category data without consent where necessary to prevent/investigate/detect an unlawful act, done without consent so as not to prejudice the purpose, and necessary for reasons of substantial public interest. Using this condition requires an **Appropriate Policy Document (APD)** to be in place — the *operative requirement* is **Sch 1 Part 2 para 5**; the *content* of the APD is defined in **Part 4 para 39** (procedures for Art 5 compliance + retention/erasure policy).

**(b) What it means for us.** Draft and maintain an **APD before** the AI scam-detection system processes any data. Cite para 10 as the condition, satisfy para 5, and structure the APD per para 39.

**(c) Penalty / risk.** Higher tier (§2.8); relying on para 10 without the APD invalidates the condition.

**(d) Citations.**
- Sch 1 para 10: https://www.legislation.gov.uk/ukpga/2018/12/schedule/1/paragraph/10
- Sch 1 para 5 (APD operative requirement): https://www.legislation.gov.uk/ukpga/2018/12/schedule/1/paragraph/5
- Sch 1 para 39 (APD contents): https://www.legislation.gov.uk/ukpga/2018/12/schedule/1/paragraph/39

### 2.3 Article 35 — Data Protection Impact Assessment (DPIA)

**(a) What it requires.** A DPIA is mandatory before processing likely to result in a high risk to individuals. Vivost hits **multiple** ICO triggers: large-scale special-category data, biometric data (age/ID verification), AI/innovative tech (scam detection), and systematic monitoring.

**(b) What it means for us.** Complete the DPIA **before processing begins**, covering accounts, messaging, payments, ID/age verification, advertiser analytics, and AI scam detection. It is the master document the DPO and solicitor will work from; keep it living.

**(c) Penalty / risk.** Higher tier (§2.8); failure to DPIA where required is itself an infringement.

**(d) Citations.**
- UK GDPR Art 35: https://www.legislation.gov.uk/eur/2016/679/article/35
- ICO — when do we need to do a DPIA: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/

### 2.4 Articles 13/14 — Privacy Information

**(a) What it requires.** Art 13 (data collected from the individual) and Art 14 (data obtained otherwise) require a clear, layered privacy notice covering purposes, lawful bases, retention, recipients, rights, and transfers.

**(b) What it means for us.** A privacy notice that explicitly explains the special-category processing, the scam-monitoring basis, and any automated decisioning (see §2.6). Surface it at signup and keep it versioned.

**(c) Penalty / risk.** Higher tier (§2.8).

**(d) Citations.**
- Art 13: https://www.legislation.gov.uk/eur/2016/679/article/13
- Art 14: https://www.legislation.gov.uk/eur/2016/679/article/14

### 2.5 Articles 15-21 — Individual Rights (ERASURE is critical)

**(a) What it requires.** Access (Art 15), rectification (Art 16), **erasure / "right to be forgotten" (Art 17)**, restriction (Art 18), portability (Art 20), objection (Art 21). Generally a **one-month** response window.

**(b) What it means for us.** **Erasure is the highest-risk right here** given the sensitivity. Build **hard-delete that cascades** across all stores (DB, backups policy, search indexes, cached snapshots, message history, analytics) — a soft-delete flag is not erasure. (Mirrors the codebase rule that reset/erase must clear all derived/keyed state, e.g. per-experience snapshots.) Build subject-access export, rectification, restriction, objection, and portability flows.

**(c) Penalty / risk.** Higher tier (§2.8).

**(d) Citations.**
- Art 15: https://www.legislation.gov.uk/eur/2016/679/article/15 · Art 16: https://www.legislation.gov.uk/eur/2016/679/article/16 · Art 17 (erasure): https://www.legislation.gov.uk/eur/2016/679/article/17 · Art 18: https://www.legislation.gov.uk/eur/2016/679/article/18 · Art 20: https://www.legislation.gov.uk/eur/2016/679/article/20 · Art 21: https://www.legislation.gov.uk/eur/2016/679/article/21
- ICO — guide to individual rights: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/

### 2.6 Article 22 → Articles 22A-22D (DUAA 2025) — Automated Decision-Making

**(a) What it requires.** **DUAA 2025 s.80 replaced UK GDPR Art 22 with new Articles 22A-22D (in force 5 February 2026)**, a "permission-plus-safeguards" model. **Art 22B specifically restricts automated decisions based on special-category data** — which is exactly what an automated ban on a Vivost user would be. Such a decision needs explicit consent or legal authorisation **plus** safeguards: notice to the individual, the ability to make representations, **human intervention/review**, and the ability to contest the decision (Art 22C).

**(b) What it means for us.** The AI scam-detection system must **not** auto-ban on special-category data without the safeguards. **Cleanest design = human-in-the-loop**: AI flags, a human decides. If any auto-action is ever introduced, it must carry notice + representation + human review + contest. Keep an audit trail.

**(c) Penalty / risk.** Higher tier (§2.8).

**(d) Citations.**
- DUAA 2025 s.80 (substitutes Art 22 with 22A-22D): https://www.legislation.gov.uk/ukpga/2025/18/section/80
- ICO — DUAA 2025, what it means for organisations: https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-what-does-it-mean-for-organisations/

### 2.7 Articles 32, 33, 34 — Security & Breach Notification

**(a) What it requires.** Art 32 — appropriate security (encryption in transit and at rest, pseudonymisation, access controls, testing). Art 33 — notify the **ICO without undue delay and, where feasible, within 72 hours** of becoming aware of a breach. Art 34 — communicate to affected individuals **without undue delay** where the breach is likely to result in high risk (which, for special-category data here, it usually will).

**(b) What it means for us.** Encrypt special-category data at rest and in transit; pseudonymise where possible; maintain an incident-response runbook hard-wired to the 72-hour ICO clock and an individual-notification path (high-risk is the default assumption here).

**(c) Penalty / risk.** Higher tier (§2.8).

**(d) Citations.**
- Art 32: https://www.legislation.gov.uk/eur/2016/679/article/32 · Art 33: https://www.legislation.gov.uk/eur/2016/679/article/33 · Art 34: https://www.legislation.gov.uk/eur/2016/679/article/34
- ICO — personal data breaches, a guide: https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/personal-data-breaches-a-guide/

### 2.8 Articles 30 & 25, ICO Fee, and Penalties

**(a) What they require.**
- **Art 30 — ROPA.** Records of processing activities are mandatory. The "fewer than 250 employees" exemption **does NOT apply** because we process special-category data (Art 30(5) carve-out) — so a full ROPA is required regardless of headcount.
- **Art 25 — privacy by design & default.** Bake data protection into architecture from the start (data minimisation, default privacy settings).
- **ICO data protection fee.** Paying is a legal requirement. Tiers (current June 2026): **Tier 1 £52** (micro), **Tier 2 £78** (small/medium, ≤250 staff or ≤£36m turnover), **Tier 3 £3,763** (large). Non-payment risks a penalty up to £4,000 on top of the fee.
- **Penalty (higher tier).** Up to **£17.5 million or 4% of total worldwide annual turnover**, whichever is higher. (Standard tier: £8.7m / 2%.)

**(b) What it means for us.** Maintain the ROPA as the single map of all processing. Apply privacy-by-design in the hexagonal core (minimise, default-private). Register and pay the ICO fee before launch.

**(d) Citations.**
- Art 30: https://www.legislation.gov.uk/eur/2016/679/article/30 · Art 25: https://www.legislation.gov.uk/eur/2016/679/article/25
- ICO — records of processing & lawful basis: https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/toolkits/accountability/records-of-processing-and-lawful-basis/
- ICO — data protection fee: https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/
- ICO — maximum fine under UK GDPR/DPA 2018: https://ico.org.uk/about-the-ico/our-information/policies-and-procedures/data-protection-fining-guidance/statutory-background/the-maximum-amount-of-a-fine-under-uk-gdpr-and-dpa-2018/

---

## 3. PECR + DATA (USE AND ACCESS) ACT 2025

### 3.1 Cookie / Storage Consent (PECR reg 6)

**(a) What it requires.** PECR reg 6 requires consent to **store or access information** on a user's device. It is technology-neutral — it covers **localStorage and similar**, not just HTTP cookies. Strictly-necessary storage is exempt; everything else needs **opt-in** consent with **reject-all parity** (rejecting must be as easy as accepting). **Important update:** PECR reg 6 was **substituted by DUAA 2025 s.112 on 5 February 2026**, which adds statutory exceptions (see §3.3) — cite the current post-Feb-2026 text.

**(b) What it means for us.** A compliant consent banner with genuine reject-all parity; no non-essential storage (analytics, advertiser-analytics scripts) before consent (subject to the new analytics exception in §3.3). Audit every localStorage/cookie write against this.

**(c) Penalty / risk.** ICO enforcement under PECR (separate from GDPR fines; PECR monetary penalties historically up to £500k, with DUAA aligning some penalties toward UK GDPR levels — confirm current ceiling with the DPO).

**(d) Citations.**
- PECR reg 6 (current text): https://www.legislation.gov.uk/uksi/2003/2426/regulation/6

### 3.2 Electronic Marketing (PECR reg 22)

**(a) What it requires.** Unsolicited electronic-mail direct marketing needs **prior opt-in consent** (subject to the limited "soft opt-in" for existing customers; DUAA added a charity soft-opt-in).

**(b) What it means for us.** Marketing emails/SMS require recorded opt-in; the referrals feature must capture consent properly and provide easy unsubscribe.

**(d) Citations.**
- PECR reg 22: https://www.legislation.gov.uk/uksi/2003/2426/regulation/22

### 3.3 DUAA 2025 — Analytics/Functionality Cookie Exception

**(a) What it requires.** DUAA 2025 **s.112** substitutes PECR reg 6 and introduces **statutory exceptions to cookie consent** for certain low-risk purposes — including **statistical / analytics** measurement, functionality, security, software updates, and interface customisation (via a new Schedule A1 to PECR). In force **5 February 2026**.

**(b) What it means for us.** First-party, low-risk analytics may now fall under the exception (no consent banner needed for those specific cookies) — but advertiser analytics, profiling, and third-party tracking generally still require consent. Have the DPO map each script to "exempt" vs "consent-required."

**(c) Penalty / risk.** As §3.1.

**(d) Citations.**
- DUAA 2025 s.112: https://www.legislation.gov.uk/ukpga/2025/18/section/112
- DUAA 2025 (full Act): https://www.legislation.gov.uk/ukpga/2025/18/contents
- ICO — DUAA 2025 guidance: https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-what-does-it-mean-for-organisations/

---

## 4. INVESTIGATORY POWERS ACT 2016

**(a) What it requires.** IPA 2016 **s.3** makes it a **criminal offence (max 2 years)** to intentionally intercept a communication in the course of its transmission over a public or private telecommunications system **without lawful authority**. Lawful authority is defined in **s.6**. A person with the right to control a system may monitor it, and the operative business-monitoring route is the **Investigatory Powers (Interception by Businesses etc.) Regulations 2018 (SI 2018/356)** (which replaced the 2000 Lawful Business Practice Regs).

**(b) What it means for us.**
- **You MAY monitor your OWN in-platform messaging system** (you control it; with appropriate notice/consent and the 2018 Regs route) — this is what the AI scam-detection should operate on.
- **You may NOT intercept users' external phone calls / SMS over public carrier networks** — there is no lawful route for a private operator, and doing so is a criminal offence.
- **Lawful alternative for phone contact: masked / proxy numbers** (a number-masking provider), so the platform never intercepts a carrier-network call/SMS.

**(c) Penalty / risk.** Criminal — up to **2 years' imprisonment** for unlawful interception.

**(d) Citations.**
- IPA 2016 s.3: https://www.legislation.gov.uk/ukpga/2016/25/section/3
- IPA 2016 s.6 (lawful authority): https://www.legislation.gov.uk/ukpga/2016/25/section/6
- Interception by Businesses Regs 2018 (SI 2018/356): https://www.legislation.gov.uk/uksi/2018/356/contents/made

---

## 5. SEXUAL OFFENCES ACT 2003

> **There is no platform safe-harbour for these offences.** Charging fees or taking a cut of transactions increases exposure. This is the single largest legal risk to the business model (see Top Risks #1).

**(a) What it requires (the offences).**
- **s.52 — causing or inciting prostitution for gain.** Indictable; max **7 years**.
- **s.53 — controlling prostitution for gain.** Indictable; max **7 years**.
- **s.53A — paying for the sexual services of a prostitute subjected to force/exploitation.** **Strict-liability** summary offence.
- **Brothel-keeping** sits in the **Sexual Offences Act 1956**: s.33 (generic, low summary penalty) and **s.33A (keeping a brothel used for prostitution)** which carries a **7-year** maximum on indictment. Multiple sex workers operating from one coordinated arrangement can constitute a brothel.

**(b) What it means for us.** Risk-mitigation industry practice, to be confirmed with a specialist solicitor:
- **Time / companionship-only framing** of listings — the platform sells *advertising for companionship/time*, not sexual services.
- **No explicit sexual-services adverts** — moderation must remove explicit offers of sex-for-money.
- **Advertiser ID + age verification** (ties to §1 HEAA and §10 card rules).
- Avoid any feature that looks like *controlling* or *organising* sellers (e.g. directing where/when they work) — that drifts toward s.53.
- Be cautious about how fees are structured; "taking a cut" of a sexual-services transaction is the most dangerous pattern.

**(c) Penalty / risk.** Up to **7 years** (ss.52/53, s.33A SOA 1956); operators exposed **personally**. Feeds POCA confiscation (§6).

**(d) Citations.**
- SOA 2003 s.52: https://www.legislation.gov.uk/ukpga/2003/42/section/52
- SOA 2003 s.53: https://www.legislation.gov.uk/ukpga/2003/42/section/53
- SOA 2003 s.53A: https://www.legislation.gov.uk/ukpga/2003/42/section/53A
- SOA 1956 s.33A (brothel used for prostitution): https://www.legislation.gov.uk/ukpga/Eliz2/4-5/69/section/33A
- CPS — prostitution and exploitation of prostitution: https://www.cps.gov.uk/publication/prostitution-and-exploitation-prostitution

---

## 6. PROCEEDS OF CRIME ACT 2002

**(a) What it requires.** SOA 2003 **ss.52 and 53 are "lifestyle offences"** listed in **POCA 2002 Schedule 2 (para 8)** — conviction can trigger **criminal-lifestyle confiscation**, meaning the court can assume assets/revenue derive from crime and confiscate accordingly. Separately, general money-laundering offences ss.327 (concealing/transferring), 328 (arrangements), 329 (acquisition/use/possession) carry up to **14 years** — profiting from the proceeds of prostitution advertising can engage these.

**(b) What it means for us.** This is the financial-existential layer behind §5: if the platform is found to facilitate ss.52/53, its **revenue can be confiscated** and directors exposed to money-laundering charges. Strengthens the case for clean, advice-led framing, KYC/AML-grade controls on advertiser onboarding, and documented anti-exploitation safeguards.

**(c) Penalty / risk.** Confiscation of platform proceeds; money-laundering up to **14 years**.

**(d) Citations.**
- POCA 2002 Schedule 2 (lifestyle offences): https://www.legislation.gov.uk/ukpga/2002/29/schedule/2
- POCA s.327: https://www.legislation.gov.uk/ukpga/2002/29/section/327 · s.328: https://www.legislation.gov.uk/ukpga/2002/29/section/328 · s.329: https://www.legislation.gov.uk/ukpga/2002/29/section/329
- CPS — proceeds of crime: https://www.cps.gov.uk/prosecution-guidance/proceeds-crime
- CPS — money laundering offences: https://www.cps.gov.uk/prosecution-guidance/money-laundering-offences

---

## 7. CRIME AND POLICING ACT 2026 + "PIMPING WEBSITE" RISK

> **⚠️ STATUS CORRECTION (verified June 2026).** The original research framed this as a "live amendment (NC1) to the Crime and Policing Bill that could criminalise operating a pimping website outright." The position has changed and is **more nuanced than that**:
>
> - The **Crime and Policing Bill became the Crime and Policing Act 2026**, which received **Royal Assent on 29 April 2026**. It is now law.
> - **The pimping-website / prostitution-advertising clause did NOT make it into the Act.** Amendment **NC1/NC2** (tabled by Sarah Champion / Tonia Antoniazzi) — which would have made it a criminal offence to *enable or profit from the prostitution of another person*, including by operating a website hosting prostitution adverts — was **not adopted**. It was not selected/pressed into the final Act, and the proposer signalled she would continue pursuing it via **Private Members' Bills** and future legislation.
>
> **So: the existential "criminalise pimping websites" risk is NOT yet law — but it is an actively pursued policy that could return in a future bill.** This is the single biggest *future* legislative threat to Vivost's model. **Monitor continuously.**

**(a) What the proposed (rejected) clause would have required.** A criminal offence to enable or profit from another person's prostitution, online and offline — explicitly targeting "pimping websites" hosting prostitution adverts. Notable design features that would directly hit Vivost if revived:
- The offence would apply **regardless of personal financial gain**.
- **Aggravating factors** would include the **platform's annual financial turnover**, the **number of prostitution-related offences facilitated**, and whether the platform **facilitated trafficking** for sexual exploitation.
- It would require the Secretary of State to **appoint a public body to monitor and enforce** compliance by online platforms (within 6 months of Royal Assent).

**(b) What it means for us.**
- **No immediate compliance action is created by the Act on this point** (the clause isn't in it).
- **But build defensively:** the "turnover as aggravating factor" and "facilitating trafficking" framing means our anti-trafficking safeguards (§8), advertiser ID/age verification, no-explicit-ads moderation, and AI scam/exploitation detection are exactly the controls that would matter if this becomes law. Architecting them now is the hedge.
- **Set up a legislative watch** (the House of Commons Library briefing "Tackling digital exploitation of women and girls" CDP-2026-0016 tracks this policy area). Treat any revived bill as potentially existential.

**(c) Penalty / risk.** Existential **if revived and enacted** — would directly criminalise the core model. Currently: a policy/monitoring risk, not a live legal duty.

**(d) Citations.**
- Crime and Policing Act 2026 (Royal Assent 29 Apr 2026): https://www.legislation.gov.uk/ukpga/2026/20/contents/enacted
- Parliamentary bill page (passage / amendments history): https://bills.parliament.uk/bills/3938
- Amendment NC1 (proposed, not adopted): https://bills.parliament.uk/bills/3938/stages/19748/amendments/10020164
- Commons Library — Lords amendments briefing (CBP-10621): https://commonslibrary.parliament.uk/research-briefings/cbp-10621/
- Commons Library — Tackling digital exploitation of women and girls (CDP-2026-0016): https://commonslibrary.parliament.uk/research-briefings/cdp-2026-0016/

---

## 8. MODERN SLAVERY ACT 2015

**(a) What it requires.** **s.54 (transparency in supply chains)** requires a commercial organisation carrying on business in the UK with **annual global turnover of £36 million or more** to publish an annual, board-approved, director-signed **modern slavery statement** on its website. Below £36m turnover the statutory statement is not mandatory.

**(b) What it means for us.**
- The **statutory statement is not required until turnover hits £36m** — but for a platform in this sector, **best-practice safeguards should be in place from day one** regardless:
  - **Advertiser ID + age verification** (also required by §1, §5, §10).
  - **Reporting routes** to the **Modern Slavery Helpline (08000 121 700 / 0800 0121 700)** and the **National Crime Agency**, surfaced in-product.
  - **Moderation for trafficking indicators** (third-party control of multiple profiles, shared contact details, scripted text, signs of coercion) — feeds the §1 illegal-content duty and the §7 defensive posture.

**(c) Penalty / risk.** s.54 itself is enforced by injunction rather than fine, but **failing on anti-trafficking is reputationally and criminally catastrophic** in this sector (links to SOA/POCA and the §7 future risk).

**(d) Citations.**
- MSA 2015 s.54: https://www.legislation.gov.uk/ukpga/2015/30/section/54
- gov.uk — publish an annual modern slavery statement: https://www.gov.uk/guidance/publish-an-annual-modern-slavery-statement
- Modern Slavery Helpline / reporting: https://www.modernslavery.gov.uk/start
- National Crime Agency — modern slavery & human trafficking: https://www.nationalcrimeagency.gov.uk/what-we-do/crime-threats/modern-slavery-and-human-trafficking

---

## 9. E-COMMERCE, CONSUMER & COMPANIES DISCLOSURE RULES

### 9.1 Electronic Commerce (EC Directive) Regulations 2002

**(a) What it requires.** Reg 6 requires a service provider to make easily, directly and permanently accessible: trading name, geographic address, email/contact details, company registration number (if incorporated), and VAT number (if VAT-registered). Still in force as assimilated UK law post-Brexit.

**(b) What it means for us.** A complete "legal info" / footer section and accessible contact details on the live site.

**(d) Citations.**
- E-Commerce Regs 2002 reg 6: https://www.legislation.gov.uk/uksi/2002/2013/regulation/6

### 9.2 Companies Disclosure (Companies Act 2006 + Names & Trading Disclosures Regs 2015)

**(a) What it requires.** Under **Companies Act 2006 s.82** and the **Company, Limited Liability Partnership and Business (Names and Trading Disclosures) Regulations 2015 (SI 2015/17, Part 6)**, the website / business communications must display the **registered company name, company number, place of registration, and registered office address**. (SI 2015/17 is the current instrument — replaces the older 2008 Trading Disclosures Regs.)

**(b) What it means for us.** Display registered company name + number + registered office + place of registration in the site footer / legal page.

**(d) Citations.**
- Companies Act 2006 s.82: https://www.legislation.gov.uk/ukpga/2006/46/section/82
- Names & Trading Disclosures Regs 2015 (SI 2015/17), Part 6: https://www.legislation.gov.uk/uksi/2015/17/part/6

### 9.3 Consumer Contracts Regulations 2013

**(a) What it requires.** For distance contracts (e.g. **paid listings / subscriptions** sold online), provide specified **pre-contract information** and a **14-day cancellation right** (cooling-off), subject to the digital-content/service exemptions if the consumer agrees to immediate performance and acknowledges loss of the cancellation right.

**(b) What it means for us.** Checkout for paid listings/subscriptions/boosts must present pre-contract info and handle the 14-day cancellation right (or correctly capture the consumer's agreement to immediate provision and waiver). Coordinate with the monetization backend.

**(d) Citations.**
- Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013: https://www.legislation.gov.uk/uksi/2013/3134

---

## 10. PAYMENT / CARD-SCHEME RULES

> **Not law, but contractually binding** — breaching them gets the platform's payment processing terminated, which is operationally fatal.

**(a) What they require.**
- **Mastercard** — adult-content merchants must complete **Specialty Merchant Registration** and meet requirements (originated via bulletin AN 5196, effective 15 Oct 2021): documented **age & identity verification (government-issued ID) of all persons depicted AND all uploaders**, documented **written consent** from those depicted, **pre-publication content review**, and a **complaint / takedown process**.
- **Visa** — equivalent rules under the **Visa Integrity Risk Program (VIRP)** (replaced the Global Brand Protection Program on 1 May 2023): age verification of consumers and creators via government ID, third-party consent, pre-publication review, complaint/takedown (within 7 business days) and monthly reporting to acquirers.
- **Mainstream processors ban adult content.** **Stripe** prohibits "adult services, including prostitution, escorts… pornography and other mature audience content" in its restricted-businesses policy. **PayPal** restricts sexually-oriented goods/services and mature-audience content.
- **Specialist adult-friendly processors:** **CCBill, Segpay, Verotel**.

**(b) What it means for us.**
- **Do not build on Stripe or PayPal** for adult-content monetization — they will terminate. Build the **payments abstraction around a specialist processor** (CCBill / Segpay / Verotel) — and keep it pluggable (matches the Verification & Payments task design).
- The card-scheme requirements (ID + age verification of everyone depicted, documented consent, pre-publication content review, takedown) **converge with §1 HEAA and §5 mitigation** — build one verification + content-review pipeline that satisfies all of them.

**(c) Penalty / risk.** Loss of payment processing (operationally fatal); scheme fines passed through by acquirers; merchant blacklisting (MATCH list).

**(d) Citations.** (Card schemes do not publish a single clean public page for adult-content rules — the binding text lives in their Rules manuals / merchant bulletins; the closest official sources are below.)
- Mastercard Rules (manual; AN 5196 sits within scheme rules): https://www.mastercard.us/content/dam/public/mastercardcom/na/global-site/documents/mastercard-rules.pdf
- Visa Integrity Risk Program (VIRP): https://usa.visa.com/support/small-business/visa-integrity-risk-program.html
- Stripe — restricted businesses: https://stripe.com/legal/restricted-businesses
- PayPal — acceptable use policy: https://www.paypal.com/us/legal/acceptableuse

---

## Appendix — Summary of Research Corrections (vs. original findings)

| Section | Original framing | Verified correction |
|---------|------------------|---------------------|
| §7 | "Crime & Policing Bill NC1 is a *live amendment* that could criminalise pimping websites." | The Bill became the **Crime and Policing Act 2026 (Royal Assent 29 Apr 2026)**, and **NC1/NC2 was NOT adopted**. The pimping-website offence is **not law** — it's an actively-pursued policy (Private Members' Bills) and a future risk to monitor. |
| §3 / §2.6 | "DUAA 2025 — verify current status." | **Royal Assent 19 June 2025.** Key operative provisions (Art 22A-22D via **s.80**; analytics cookie exception + PECR reg 6 substitution via **s.112**) came **into force 5 February 2026**. Art 22B specifically restricts ADM on special-category data. |
| §1 | "Deadlines passed (Jan/Jul 2025)." | Precise dates: illegal-content risk assessment **16 Mar 2025**, safety duties **17 Mar 2025**, HEAA **25 Jul 2025**; finalised Part 5 HEAA guidance **14 Jan 2026**. |
| §5 | "s.33A keeping a brothel." | The serious offence is **s.33A of the Sexual Offences Act 1956** (brothel used for prostitution, 7 yrs) — distinct from generic s.33 (low summary penalty). |
| §2.2 | "Appropriate Policy Document (DPA Sch 1 Part 4)." | APD *operative requirement* is **Sch 1 Part 2 para 5**; Part 4 **para 39** only defines its *contents*. Cite both. |
| §9.2 | "Companies (Trading Disclosures) Regulations." | Current instrument is **SI 2015/17 (Names and Trading Disclosures Regs 2015), Part 6**, under **CA 2006 s.82** — not the older 2008 regs. |
| §10 | "Visa adult-content rules." | Visa's program is now **VIRP** (replaced Global Brand Protection Program, 1 May 2023). Neither Mastercard nor Visa publishes a single clean public adult-content page; binding text is in their Rules manuals. |
