// Generates batched SQL files to load listings.json into Supabase public.workers.
// Batched so each file stays small enough to execute in one call.
// Run: node gen_insert.mjs   ->   data/insert_batch_1.sql ...

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const DATA = fileURLToPath(new URL("./data/", import.meta.url));
const BATCH = 60;
const PHOTO_CAP = 8; // cap photos per row to keep payload lean (website keeps all)

function splitLoc(raw) {
  if (!raw) return [null, null];
  const p = raw.split(" - ");
  return p.length >= 2
    ? [p.slice(0, -1).join(" - ").trim(), p[p.length - 1].trim()]
    : [null, raw.trim()];
}

const COLS =
  "source_url, source_ad_id, title, description, gender, age, ethnicity, languages, location_raw, location_area, location_city, region, ad_type, service_for, services, rates, phones, photos, verified, has_phone, incall, outcall, flags, scraped_at";
const TYPES =
  "source_url text, source_ad_id text, title text, description text, gender text, age int, ethnicity text, languages jsonb, location_raw text, location_area text, location_city text, region text, ad_type text, service_for text, services jsonb, rates jsonb, phones jsonb, photos jsonb, verified boolean, has_phone boolean, incall boolean, outcall boolean, flags jsonb, scraped_at timestamptz";

function toRec(r) {
  const [area, city] = splitLoc(r.location_raw);
  const hp = (r.phones || []).length > 0;
  return {
    source_url: r.source_url,
    source_ad_id: r.source_ad_id,
    title: r.title,
    description: r.description,
    gender: r.gender,
    age: r.age,
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
    photos: (r.photos || []).slice(0, PHOTO_CAP),
    verified: !!r.verified,
    has_phone: hp,
    incall: !!r.incall,
    outcall: !!r.outcall,
    flags: hp ? [] : ["no_phone"],
    scraped_at: r.scraped_at,
  };
}

async function main() {
  const rows = JSON.parse(await readFile(DATA + "listings.json")).filter(
    (r) => !r.error && r.source_ad_id
  );
  const recs = rows.map(toRec);
  let batchNo = 0;
  for (let i = 0; i < recs.length; i += BATCH) {
    batchNo++;
    const chunk = recs.slice(i, i + BATCH);
    const json = JSON.stringify(chunk).replace(/'/g, "''");
    const prefix = i === 0 ? "truncate public.workers;\n" : "";
    const sql =
      prefix +
      `insert into public.workers (${COLS})\n` +
      `select x.* from jsonb_to_recordset('${json}'::jsonb) as x(${TYPES})\n` +
      `on conflict (source_url) do nothing;`;
    await writeFile(`${DATA}insert_batch_${batchNo}.sql`, sql);
    console.log(`batch ${batchNo}: rows ${chunk.length}, bytes ${sql.length}`);
  }
  console.log(`Total ${recs.length} rows in ${batchNo} batches.`);
}

main();
