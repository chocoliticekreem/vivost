import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const KNOWN_LABELS = [
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

// Lines that signal the services list has ended.
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

function adIdFromUrl(url) {
  const m = url.match(/(\d+)\/?$/);
  return m ? m[1] : null;
}

// Pull "label -> value" by treating tabs as line breaks, then pairing a label
// line with the next non-empty line.
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
  const startIdx = lines.findIndex((l) =>
    /services i offer/i.test(l)
  );
  if (startIdx === -1) return [];
  const services = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    if (/\(at discretion\)/i.test(l)) continue;
    const low = l.toLowerCase();
    if (SERVICE_STOP.some((s) => low.includes(s))) break;
    if (l.length > 60) break; // ran into prose / description
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

function parsePhones(...texts) {
  const joined = texts.join(" ");
  const phones = new Set();
  // UK mobile/landline and international 44 forms
  const re = /(?:\+?44\s?|0044\s?|0)\s?(?:7\d|1\d|2\d|3\d|8\d)(?:[\s-]?\d){7,9}/g;
  let m;
  while ((m = re.exec(joined)) !== null) {
    const digits = m[0].replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length >= 10) phones.add(digits);
  }
  return [...phones];
}

async function scrapeOne(page, url) {
  const adId = adIdFromUrl(url);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  // best-effort cookie/consent dismissal
  for (const sel of [
    'button:has-text("Accept")',
    'button:has-text("Agree")',
    '#onetrust-accept-btn-handler',
  ]) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 800 })) await b.click({ timeout: 800 });
    } catch {}
  }
  // unblur photos
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
    // keep only images belonging to THIS ad, prefer clear ones, strip blur flag
    const mine = imgs
      .filter((s) => !adId || s.includes("/clad/" + adId + "/"))
      .map((s) => s.replace(/\?.*$/, ""));
    const uniqueImgs = [...new Set(mine)];
    const meta = (sel) => document.querySelector(sel)?.getAttribute("content") || null;
    return {
      pageTitle: document.title || null,
      metaDescription:
        meta('meta[name="description"]') || meta('meta[property="og:description"]'),
      bodyText: document.body ? document.body.innerText : "",
      images: uniqueImgs,
    };
  }, adId);

  const labeled = parseLabeledBlock(data.bodyText);
  const services = parseServices(data.bodyText);
  const rates = parseRates(data.bodyText);
  const phones = parsePhones(data.pageTitle, url, data.bodyText);

  // Page title looks like: "City - City Escorts | AD HEADLINE - 123456 | Vivastreet"
  // The ad headline is the 2nd pipe segment, with the trailing ad id stripped.
  let title = null;
  let name = null;
  if (data.pageTitle) {
    const segs = data.pageTitle.split("|").map((s) => s.trim());
    let head = segs.length >= 2 ? segs[1] : segs[0];
    head = head.replace(/\s*-\s*\d{6,}\s*$/, "").trim();
    title = head || null;
    // best-effort first-name guess: leading alphabetic token, if it isn't a generic word
    const tok = (title || "").match(/^[^a-z]*([A-Za-z]{3,})/);
    if (tok && !/^(new|hot|sexy|the|best|young|real|top|busty|party)$/i.test(tok[1])) {
      name = tok[1];
    }
  }

  const ageMatch = (labeled["Age"] || "").match(/(\d{2})/);

  // Clean advertiser prose: prefer meta description, strip boilerplate.
  let description = (data.metaDescription || "").trim();
  if (/contact all advertisers on vivastreet/i.test(description)) description = "";

  return {
    source_url: url,
    source_ad_id: adId,
    title,
    name,
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
    photos: data.images,
    raw_text: data.bodyText.slice(0, 8000),
    scraped_at: new Date().toISOString(),
  };
}

async function main() {
  const urls = JSON.parse(
    await readFile(new URL("./urls.json", import.meta.url))
  );
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    viewport: { width: 1366, height: 900 },
  });
  const page = await ctx.newPage();
  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const row = await scrapeOne(page, url);
      results.push(row);
      console.log(
        `[${i + 1}/${urls.length}] ${(row.title || "?").slice(0, 40)} | name=${row.name || "-"} | ${row.gender || "-"} | age ${row.age || "-"} | ${row.location_raw || "-"} | ${row.photos.length} imgs | ${row.phones.length} ph`
      );
    } catch (e) {
      console.log(`[${i + 1}/${urls.length}] FAILED ${url} :: ${e.message}`);
      results.push({ source_url: url, error: e.message });
    }
    await page.waitForTimeout(1200 + Math.floor(Math.random() * 800));
  }
  await browser.close();
  await mkdir(new URL("./data/", import.meta.url), { recursive: true });
  await writeFile(
    new URL("./data/listings.json", import.meta.url),
    JSON.stringify(results, null, 2)
  );
  const ok = results.filter((r) => !r.error).length;
  console.log(`\nDone. ${ok}/${urls.length} scraped -> scraper/data/listings.json`);
}

main();
