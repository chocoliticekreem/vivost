// Loads data/listings.json into Supabase public.workers via PostgREST.
// Usage: node load_rest.mjs <anon_or_publishable_key>
import { readFile } from "node:fs/promises";

const URL_BASE = "https://eybxzurxznengffexpis.supabase.co";
const KEY = process.argv[2];
if (!KEY) { console.error("Missing API key arg"); process.exit(1); }

function splitLoc(raw) {
  if (!raw) return [null, null];
  const p = raw.split(" - ");
  return p.length >= 2
    ? [p.slice(0, -1).join(" - ").trim(), p[p.length - 1].trim()]
    : [null, raw.trim()];
}

function toRec(r) {
  const [area, city] = splitLoc(r.location_raw);
  const hp = (r.phones || []).length > 0;
  return {
    source_url: r.source_url,
    source_ad_id: r.source_ad_id,
    title: r.title,
    description: r.description,
    gender: r.gender,
    age: r.age ?? null,
    ethnicity: r.ethnicity,
    languages: r.languages || [],
    location_raw: r.location_raw,
    location_area: area,
    location_city: city,
    region: r.region || null,
    ad_type: r.ad_type,
    service_for: r.service_for,
    services: r.services || [],
    rates: r.rates || [],
    phones: r.phones || [],
    photos: r.photos || [],
    verified: !!r.verified,
    has_phone: hp,
    incall: !!r.incall,
    outcall: !!r.outcall,
    flags: hp ? [] : ["no_phone"],
    scraped_at: r.scraped_at,
  };
}

async function main() {
  const rows = JSON.parse(await readFile(new URL("./data/listings.json", import.meta.url)))
    .filter((r) => !r.error && r.source_ad_id)
    .map(toRec);

  const CHUNK = 40;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const res = await fetch(`${URL_BASE}/rest/v1/workers`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=ignore-duplicates",
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`Chunk ${i / CHUNK + 1} failed: ${res.status} ${txt.slice(0, 300)}`);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`inserted ${inserted}/${rows.length}`);
  }
  console.log("DONE. Inserted", inserted, "rows.");
}

main();
