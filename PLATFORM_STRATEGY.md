# Vivost — Platform Expansion Strategy & Ideas

Synthesised from research (June 2026) on monetization, supply-side value, growth,
lawful scam-prevention, and UK GDPR. **This is researched analysis, not legal advice.**
The Article 9 / interception / SOA points need sign-off from a UK solicitor + DPO before launch.

---

## 0. The honest frame (read first)

Two truths shape every idea below:

1. **"Charge more + take a cut of bookings"** pushes toward the *worst* legal and financial
   spot. Taking commission/escrow on in-person bookings (a) edges into "controlling
   prostitution for gain" (SOA 2003 s.53, up to 7 yrs) and (b) bleeds ~14% to high-risk
   adult payment processors (Stripe/PayPal ban adult; CCBill/Segpay/Verotel only).
   **Flat advertiser fees + visibility boosts + verification + subscriptions** make more
   money with far less legal/margin risk. Charge more by selling *value*, not by taxing sex.

2. **The "phone interception / AI monitors chats" idea splits cleanly in two:**
   - ❌ **Intercepting users' real phone calls/SMS = a criminal offence** (Investigatory
     Powers Act 2016 s.3, up to 2 yrs). No lawful route for a private operator. Off the table.
   - ✅ **Keep contact inside the platform** (in-app chat + masked/proxy numbers you operate),
     run AI scam detection on *that*. Lawful, and actually *required* by the Online Safety Act.
     The real constraint is GDPR Article 9 (the messages reveal sex life = special category data).

---

## 1. Monetization — "charge more" sustainably

Recommended stack, in build order (avoid commission/escrow on bookings entirely):

| # | Model | Concrete | Benchmark |
|---|---|---|---|
| 1 | **Flat advertiser tiers** | 3 feature-gated monthly plans | Tryst $39 / $69 / $119 |
| 2 | **Featured / bump placement** (consumable) | Pay to top a city/category for a window | Tinder Boost ~£7; Vinted Spotlight £6.95/7d |
| 3 | **Paid verification badge** | One-off ID/photo verify fee → trust badge | Seeking $50 check. You must verify anyway (OSA + Mastercard) — charge for it |
| 4 | **Annual advertiser subscription** | Bundle fee waivers, analytics, badge; annual lock-in cuts churn | AdultWork Plus £24.99/mo, £249.99/yr |
| 5 | **Client credit wallet + service fee on top-up** | Clients buy credits to message/view; skim fee on top-up (invisible take + float) | AdultWork 1cr=£1. Biggest prize, highest build/compliance — sequence LAST |
| — | ❌ **Commission/escrow on bookings** | AVOID — legal facilitation risk + 14% processor take | — |

Payments reality: budget ~11–14% effective + ~5% rolling reserve (held ~6mo) + ~$500–1000/yr
fees on adult rails. Model financials on flat fees, not GMV.

## 2. Supply-side value — what makes workers stay & pay (this is the moat)

Key finding: **in sex work the top willingness-to-pay feature is SAFETY/SCREENING, not marketing.**
A screening tool used during every booking = daily engagement + retention + legal/reputational armour.

Priority:
1. **Client screening / mutual verification** — clients verify once; workers see verified status + history before booking. (P411 model — the strongest paid hook in the space.)
2. **Number/email reverse-checker in the inbox** — check a client against a reported-offender DB. Mirror Vivastreet's National Ugly Mugs (NUM) partnership (since 2015).
3. **Bad-date list + reverse reviews (worker-rates-client), provider-only visibility** — keeps safety intel inside the product instead of leaking to WhatsApp/forums.
4. **Booking check-in / panic feature** — timer auto-alerts a trusted contact if not cleared.
5. **Platform-native deposits / anti-timewaster** structured enquiry forms — reduce no-shows.
6. **Verified-ID / photo trust badges** — combats #1 client complaint (fake photos). Low effort, doubles as compliance.
7. **Per-listing analytics behind the paid tier** — views→contacts→conversion vs category avg. Proof-of-ROI drives upgrades. (Slixa/Fiverr model.)

## 3. Userbase growth / network effects

The directory cold-start playbook: **win the scarce side first, in ONE city, then scale programmatic SEO.**

1. **Win supply first, one city + niche at a time** (free seeded listings) → demand attaches ~5x cheaper. (NFX/Outdoorsy.)
2. **Single-player utility first** — ship the safety/screening tools as standalone value before the network exists; locks in supply.
3. **Programmatic city × category SEO** with *genuine* local content (not thin dupes) — the core engine. (Airbnb: ~1.1M pages → 18M+ monthly organic visits.)
4. **Reviews flywheel** — trust signal + retention + fresh ranking content.
5. **Double-sided referral gated on activation** — bigger payout for the scarce supply side. (Dropbox: 100K→4M in 15mo.)
6. **Free-tier → paid funnel** — free base listing, throttle reach, sell visibility (2–5% typical freemium conversion; 5–15% for high-intent tools).
7. **Content/SEO blog** for informational queries; **mobile app** later (note app-store adult bans).

## 4. The scam-prevention feature — lawful design

**Build this (priority order):**
1. **In-platform chat as the default channel** — no real numbers exchanged. Lawful to moderate because it's *your* system (IPA s.3(2) "right to control the system" exemption — removes the criminal-interception problem).
2. **Masked/proxy numbers** (Twilio Proxy pattern, like Uber/Airbnb) when phone contact is needed — the lawful substitute for "interception." You own the numbers; neither party sees the other's real number. Log metadata; recording call *content* needs disclosure + a basis + engages Art 9.
3. **LLM + keyword scam classifier** over on-platform messages. Detect: upfront deposits, gift cards/crypto, "move to WhatsApp" early, overpayment refund, "verify on this site" card-harvest links, urgency. (Fine-tuned LLM SMS classifiers ~98% acc.)
4. **Sender-side nudges** ("Are you sure?", "don't take this off-platform") + **number/link stripping** — highest-ROI, behaviour-changing, privacy-light. (Tinder cut inappropriate msgs >10%; Bumble Deception Detector auto-blocked 95% of flagged scam accounts, −45% reports.)
5. **Risk scoring + human-in-the-loop moderation with appeals.**

**GDPR conditions on the scam feature (non-negotiable):**
- Art 6: legitimate interests (fraud prevention named in Recital 47) + documented LIA.
- **Art 9: messages reveal sex life = special category. No legitimate-interests route.** Need substantial-public-interest (Art 9(2)(g)) + DPA 2018 Sch 1 "preventing/detecting unlawful acts" + an **Appropriate Policy Document**. Blanket scanning of intimate content is a *weak fit* — survive only with narrow targeting, strict minimisation/retention.
- **Mandatory DPIA** (hits multiple Art 35 triggers).
- **Art 22 / new 22A–22D (DUAA 2025):** auto-banning on Art 9 data is restricted. **Cleanest design: AI flags → human with real authority decides.** Keeps it out of "solely automated." If ever fully automated: need an Art 22B condition + all four Art 22C safeguards (notice, representations, human review, contest).
- Full transparency in the privacy notice (no covert scanning).

## 5. GDPR architecture — must be TRUE of the expanded platform

The governing fact: **treat essentially all core platform data as Article 9 special category**
(it reveals sex life). That means **Art 6 basis AND a separate Art 9 condition for everything.**

- **Routine data (accounts, messaging, payments):** Art 9(2)(a) **explicit consent** — unbundled, opt-in, naming "data concerning your sex life," separate from marketing consent, with a consent-record store.
- **Consent withdrawal → erasure cascade.** Because the basis is consent, withdrawal triggers Art 17 deletion. Build **hard, propagated deletion** (DB, backups, search indexes, AI feature stores, processors) — a "deactivate" flag is NOT erasure.
- **ID & age verification:** store a **pass/fail flag + date + method, NEVER the ID image/selfie.** Delete artefacts immediately. Prefer facial age *estimation* or a third-party token. HEAA is mandatory under OSA (self-declaration fails). Verification vendors = processors (Art 28 contract).
- **Biometrics:** age *estimation* may avoid Art 9; storing a matchable face template does NOT — that needs Art 9 + Sch 1 + APD + DPIA.
- **Security (Art 32):** highest tier — encryption at rest + in transit, pseudonymisation. **Separate identity store from activity store** (different keys) so an activity-DB breach doesn't reveal who people are.
- **Breach (Art 33/34):** a breach here is almost certainly "high risk" → 72h ICO notice + individual notification (unless data was strongly encrypted — another reason to encrypt).
- **Accountability:** ROPA (mandatory — special category removes the small-org exemption), DPIA, LIA, APD, retention schedule, consent records. Higher fine tier £17.5m / 4% global turnover.
- **Privacy-by-design:** proxy/masked contact (never store real phone/email for contact), store verification *results* not artefacts, PSP tokenised payments, minimal-by-default profiles, automated retention purge.

## 6. On "lots of changes at once and it be flawless"

Honest counsel: **don't ship this all at once.** Each pillar (accounts, messaging, payments,
ID/age verification, AI monitoring) is independently a DPIA-triggering, special-category system.
"Big-bang flawless" is how you get a catastrophic breach or a compliance gap. Sequence it:

- **Phase 1 (cash + trust, low legal load):** flat advertiser tiers + featured/bump + paid verification badge + free→paid funnel + programmatic city SEO in ONE city. (Mostly extends current build.)
- **Phase 2 (the moat):** safety/screening suite (reverse-checker, bad-date list, check-in) as single-player utility + per-listing analytics + annual subscription + reviews flywheel.
- **Phase 3 (the hard, regulated platform):** accounts + in-platform chat + masked numbers + AI scam detection + real HEAA age assurance + client credit wallet. **Gate this phase on DPIA + lawyer/DPO sign-off.**

## 7. Existential risks that NO feature fixes (need a solicitor first)

- **SOA 2003 s.52/s.53 + Proceeds of Crime Act** — profiting from prostitution advertising; "charging more" / taking cuts worsens this.
- **Crime & Policing Bill (NC1)** — live amendment could criminalise operating a "pimping website" outright.
- **OSA age assurance** — HEAA mandatory now; current localStorage gate is non-compliant.

Get specialist UK criminal/regulatory + data-protection advice before Phase 3. The features
above reduce risk and are good practice, but they are not a substitute for that advice.
