import { chromium } from "playwright";
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  scrapeOne,
  collectListingLinks,
  makeContext,
  isProfileUrl,
  slugHasPhone,
  adIdFromUrl,
} from "./lib.mjs";

const NATIONAL = "https://www.vivastreet.co.uk/escort/gb";
const TARGET_TOTAL = 170;     // total London rows we want in listings.json
const MAX_TRIES = 700;        // profiles to open before giving up
const MAX_CANDIDATES = 1400;
const PAGES_PER_SEED = 20;

// Vivastreet's London region + sub-region listing pages. Seeded explicitly so
// we don't depend on one sample profile's breadcrumb for coverage.
const LONDON_SUBREGIONS = [
  "london",
  "central-london",
  "north-london",
  "south-london",
  "east-london",
  "west-london",
  "south-east-london",
  "south-west-london",
  "north-west-london",
].map((s) => `https://www.vivastreet.co.uk/escort/${s}`);

const DATA = fileURLToPath(new URL("./data/", import.meta.url));
const LISTINGS = DATA + "listings.json";
const LOG = DATA + "harvest.log";

const isLondonUrl = (u) => /london/i.test(u);
// A region/area listing page: single path segment after /escort/, not a profile.
function isListingUrl(u) {
  try {
    const p = new URL(u).pathname.replace(/\/$/, "");
    return /^\/escort\/[^/]+$/.test(p) && !isProfileUrl(u);
  } catch {
    return false;
  }
}

async function log(line) {
  console.log(line);
  try { await appendFile(LOG, line + "\n"); } catch {}
}

// Find London region/sub-region listing URLs from a profile's breadcrumb.
async function discoverLondonSeeds(page, sampleProfileUrl) {
  const seeds = new Set();
  for (const start of [sampleProfileUrl, NATIONAL].filter(Boolean)) {
    try {
      await page.goto(start, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(500);
      const anchors = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/escort/"]')).map((a) => ({
          text: (a.textContent || "").trim(),
          href: a.href,
        }))
      );
      for (const a of anchors) {
        if (/escorts? and massages?$/i.test(a.text) && /london/i.test(a.text) && isListingUrl(a.href)) {
          seeds.add(a.href.split("?")[0]);
        }
      }
      // From a London region page, also harvest its sub-region listing links.
      for (const a of anchors) {
        if (isListingUrl(a.href) && isLondonUrl(a.href)) seeds.add(a.href.split("?")[0]);
      }
    } catch {}
    if (seeds.size > 0 && start === sampleProfileUrl) break;
  }
  return [...seeds];
}

async function gatherCandidates(page, seeds, seenIds) {
  const candidates = new Set();
  for (const seed of seeds) {
    let prev = -1;
    for (let p = 1; p <= PAGES_PER_SEED; p++) {
      if (candidates.size >= MAX_CANDIDATES) break;
      const url = p === 1 ? seed : `${seed}?page=${p}`;
      let links = [];
      try { links = await collectListingLinks(page, url); } catch { break; }
      for (const l of links) {
        if (!isLondonUrl(l)) continue;
        if (seenIds.has(adIdFromUrl(l))) continue;
        candidates.add(l);
      }
      if (candidates.size === prev) break;
      prev = candidates.size;
      await page.waitForTimeout(500);
    }
    await log(`  seed ${seed.split("/escort/")[1]} -> ${candidates.size} candidates so far`);
    if (candidates.size >= MAX_CANDIDATES) break;
  }
  // phone-in-slug first (small boost), though most numbers live in the title.
  return [...candidates].sort((a, b) => Number(slugHasPhone(b)) - Number(slugHasPhone(a)));
}

async function main() {
  await mkdir(DATA, { recursive: true });
  await writeFile(LOG, `Harvest start. target total=${TARGET_TOTAL} London rows\n`);

  let existing = [];
  try { existing = JSON.parse(await readFile(LISTINGS)); } catch {}
  const seenIds = new Set(existing.filter((r) => r.source_ad_id).map((r) => r.source_ad_id));
  const sampleProfile = existing.find((r) => r.source_url)?.source_url || null;
  await log(`Existing rows: ${existing.length}. Seed profile: ${sampleProfile || "(none)"}`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await makeContext(browser);
  const page = await ctx.newPage();

  const need = Math.max(0, TARGET_TOTAL - existing.length);
  if (need === 0) {
    await log(`Already at ${existing.length} >= ${TARGET_TOTAL}. Nothing to do.`);
    await browser.close();
    return;
  }
  await log(`Need ${need} more London rows to reach ${TARGET_TOTAL}.`);

  const discovered = await discoverLondonSeeds(page, sampleProfile);
  const seeds = [...new Set([...LONDON_SUBREGIONS, ...discovered])];
  await log(`Using ${seeds.length} London seed listings:\n  ${seeds.join("\n  ")}`);

  const candidates = await gatherCandidates(page, seeds, seenIds);
  await log(`Total candidates: ${candidates.length}`);

  const withPhone = [];
  const noPhone = [];
  let tries = 0;
  for (const url of candidates) {
    if (withPhone.length >= need || tries >= MAX_TRIES) break;
    if (seenIds.has(adIdFromUrl(url))) continue;
    seenIds.add(adIdFromUrl(url));
    tries++;
    try {
      const row = await scrapeOne(page, url);
      if (!row.is_london) {
        await log(`  [skip #${tries}] not London (${row.region || "?"}) ${(row.title || "").slice(0, 28)}`);
      } else if (row.has_phone) {
        withPhone.push(row);
      } else {
        noPhone.push(row);
      }
      if (tries % 10 === 0)
        await log(`  progress: opened ${tries}, withPhone ${withPhone.length}, noPhone ${noPhone.length}`);
    } catch (e) {
      await log(`  [err #${tries}] ${e.message.slice(0, 60)}`);
    }
    await page.waitForTimeout(650 + Math.floor(Math.random() * 500));
  }
  await browser.close();

  // Phone-first; fill remainder with tagged no-phone London ads.
  const newRows = withPhone.slice(0, need);
  if (newRows.length < need) {
    newRows.push(...noPhone.slice(0, need - newRows.length));
  }

  const merged = existing.concat(newRows);
  await writeFile(LISTINGS, JSON.stringify(merged, null, 2));

  const taggedNoPhone = newRows.filter((r) => !r.has_phone).length;
  await log(
    `\nDONE. Added ${newRows.length} new London ads (${newRows.length - taggedNoPhone} with phone, ${taggedNoPhone} tagged no_phone). ` +
    `Opened ${tries}. Total now ${merged.length}. -> data/listings.json`
  );
}

main().catch((e) => log("FATAL: " + e.stack));
