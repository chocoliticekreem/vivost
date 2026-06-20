// Shared scraping logic for Vivastreet escort listings.

export const KNOWN_LABELS = [
  "Location",
  "Type of ad",
  "Gender",
  "Age",
  "Ethnicity",
  "Nationality",
  "Language",
  "My service is for",
  "Hair colour",
  "Eye colour",
  "Body type",
];

const SERVICE_STOP = [
  "contact the advertiser",
  "report this ad",
  "safety",
  "reviews",
  "similar ads",
  "posted by",
  "share this ad",
  "more ads",
  "you may also",
];

export function adIdFromUrl(url) {
  const m = url.match(/(\d+)\/?$/);
  return m ? m[1] : null;
}

// A vivastreet escort profile url: /escort/<area>/<slug>/<numericId>
export function isProfileUrl(url) {
  return /\/escort\/[^/]+\/[^/]+\/\d+(?:\/)?$/.test(url);
}

// UK phone (mobile-focused). Exact digit counts prevent over-capturing a
// trailing digit. Returns canonical 0XXXXXXXXXX form, deduped.
export function extractPhones(...texts) {
  const joined = texts.join(" ");
  const out = new Set();
  const re = /(?:\+?44[\s-]?|0)7(?:[\s-]?\d){9}/g;
  let m;
  while ((m = re.exec(joined)) !== null) {
    let d = m[0].replace(/\D/g, "");
    if (d.startsWith("44")) d = "0" + d.slice(2);
    if (d.length >= 11 && d.startsWith("07")) out.add(d.slice(0, 11));
  }
  return [...out];
}

export function slugHasPhone(url) {
  return /(?:0|44)7\d(?:[\s-]?\d){8}/.test(url.split("/").pop() || "");
}

// Strip Vivastreet's appended boilerplate ("<TITLE> escorts <area> are waiting
// for you...") from the meta description to leave just the advertiser's prose.
export function cleanDescription(desc, title) {
  if (!desc) return null;
  let d = desc.replace(/\s+/g, " ").trim();
  const cut = d.search(/\bare waiting for you\b/i);
  if (cut > 40) d = d.slice(0, cut);
  if (title) {
    const head = title.slice(0, 14);
    const idx = head ? d.indexOf(head, 40) : -1;
    if (idx > 40) d = d.slice(0, idx);
  }
  d = d.replace(/\s*[•|]\s*$/, "").replace(/\.{2,}$/, "").trim();
  return d || null;
}

function parseLabeledBlock(text) {
  const lines = text
    .replace(/\t/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const out = {};
  for (let i = 0; i < lines.length - 1; i++) {
    if (KNOWN_LABELS.includes(lines[i])) {
      const val = lines[i + 1];
      if (!KNOWN_LABELS.includes(val)) out[lines[i]] = val;
    }
  }
  return out;
}

function parseServices(text) {
  const lines = text.split("\n").map((l) => l.trim());
  const startIdx = lines.findIndex((l) => /services i offer/i.test(l));
  if (startIdx === -1) return [];
  const services = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    if (/\(at discretion\)/i.test(l)) continue;
    const low = l.toLowerCase();
    if (SERVICE_STOP.some((s) => low.includes(s))) break;
    if (l.length > 60) break;
    services.push(l);
    if (services.length > 40) break;
  }
  return services;
}

function parseRates(text) {
  const rates = [];
  const re = /£\s?(\d{2,4})\s*(p\/h|per hour|\/hr|hr|hour|incall|outcall|30\s*min|15\s*min|45\s*min)?/gi;
  let m;
  const seen = new Set();
  while ((m = re.exec(text)) !== null) {
    const amount = Number(m[1]);
    const unit = (m[2] || "").trim().toLowerCase();
    const key = amount + "|" + unit;
    if (seen.has(key)) continue;
    seen.add(key);
    rates.push({ amount, unit: unit || null });
    if (rates.length > 12) break;
  }
  return rates;
}

async function dismissConsent(page) {
  for (const sel of [
    'button:has-text("Accept")',
    'button:has-text("Agree")',
    "#onetrust-accept-btn-handler",
  ]) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 700 })) await b.click({ timeout: 700 });
    } catch {}
  }
}

// Collect profile urls from a listing page.
export async function collectListingLinks(page, listingUrl) {
  await page.goto(listingUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissConsent(page);
  await page.waitForTimeout(500);
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/escort/"]')).map((a) => a.href)
  );
  return [...new Set(hrefs)].filter(isProfileUrl);
}

export async function scrapeOne(page, url) {
  const adId = adIdFromUrl(url);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissConsent(page);
  try {
    const btns = page.locator(".vs-blurred-photo-btn");
    const n = await btns.count();
    for (let i = 0; i < Math.min(n, 30); i++) {
      try { await btns.nth(i).click({ timeout: 500 }); } catch {}
    }
  } catch {}
  await page.waitForTimeout(800);

  const data = await page.evaluate((adId) => {
    const imgs = Array.from(document.querySelectorAll("img"))
      .map((i) => i.src)
      .filter((s) => s && s.includes("viva-images.com"));
    const mine = imgs
      .filter((s) => !adId || s.includes("/clad/" + adId + "/"))
      .map((s) => s.replace(/\?.*$/, ""));
    const meta = (sel) => document.querySelector(sel)?.getAttribute("content") || null;
    return {
      pageTitle: document.title || null,
      metaDescription:
        meta('meta[name="description"]') || meta('meta[property="og:description"]'),
      bodyText: document.body ? document.body.innerText : "",
      images: [...new Set(mine)],
    };
  }, adId);

  const labeled = parseLabeledBlock(data.bodyText);
  const services = parseServices(data.bodyText);
  const rates = parseRates(data.bodyText);
  const phones = extractPhones(data.pageTitle, url, data.metaDescription || "", data.bodyText);

  let title = null;
  if (data.pageTitle) {
    const segs = data.pageTitle.split("|").map((s) => s.trim());
    let head = segs.length >= 2 ? segs[1] : segs[0];
    head = head.replace(/\s*-\s*\d{6,}\s*$/, "").trim();
    title = head || null;
  }

  const ageMatch = (labeled["Age"] || "").match(/(\d{2})/);
  let description = (data.metaDescription || "").trim();
  if (/contact all advertisers on vivastreet/i.test(description)) description = "";
  description = cleanDescription(description, title);

  // Authoritative region from Vivastreet's own breadcrumb:
  // "...UK Escorts and Massages<REGION> Escorts and Massages<AREA>..."
  const regionMatch = data.bodyText.match(
    /UK Escorts and Massages\s*([A-Za-z][A-Za-z &'-]*?)\s*Escorts and Massages/
  );
  const region = regionMatch ? regionMatch[1].trim() : null;
  const locRaw = labeled["Location"] || "";
  const isLondon = /london/i.test(region || "") || /london/i.test(locRaw);
  const hasPhone = phones.length > 0;
  const flags = [];
  if (!hasPhone) flags.push("no_phone");

  return {
    source_url: url,
    source_ad_id: adId,
    title,
    name: null, // clean first name needs the LLM normalization pass
    description: description || null,
    gender: labeled["Gender"] || null,
    age: ageMatch ? Number(ageMatch[1]) : null,
    ethnicity: labeled["Ethnicity"] || labeled["Nationality"] || null,
    languages: labeled["Language"]
      ? labeled["Language"].split(/[,/]/).map((s) => s.trim()).filter(Boolean)
      : [],
    location_raw: labeled["Location"] || null,
    ad_type: labeled["Type of ad"] || null,
    service_for: labeled["My service is for"] || null,
    services,
    rates,
    phones,
    has_phone: hasPhone,
    region,
    is_london: isLondon,
    flags,
    verified: /ID Verified/i.test(data.bodyText),
    incall: /incall/i.test(data.bodyText),
    outcall: /outcall/i.test(data.bodyText),
    photos: data.images,
    raw_text: data.bodyText.slice(0, 8000),
    scraped_at: new Date().toISOString(),
  };
}

export function makeContext(browser) {
  return browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    viewport: { width: 1366, height: 900 },
  });
}
