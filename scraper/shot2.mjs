import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = "http://localhost:3000";
const SHOTS = fileURLToPath(new URL("./shots/", import.meta.url));

// find a no-phone profile id from the generated data
const gen = await readFile("/Users/burgerking/vivost/vivost/build/src/data/profiles.generated.ts", "utf8");
const arr = JSON.parse(gen.match(/export const PROFILES: Profile\[\] =\s*(\[[\s\S]*\]);/)[1]);
const noPhone = arr.find((p) => !p.phone);
console.log("no-phone profile:", noPhone?.id, noPhone?.name?.slice(0, 30), "flags:", JSON.stringify(noPhone?.flags));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
await ctx.addInitScript(() => { try { localStorage.setItem("age-confirmed", "true"); } catch {} });
const page = await ctx.newPage();

await page.goto(`${BASE}/search`, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1200);
const resultsText = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll("*")).find((e) => /Results Found/.test(e.textContent || "") && e.children.length === 0);
  return el ? el.textContent.trim() : "(not found)";
});
console.log("search page:", resultsText);
await page.screenshot({ path: SHOTS + "search.png", fullPage: false });

if (noPhone) {
  await page.goto(`${BASE}/profile/${noPhone.id}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: SHOTS + "detail-nophone.png", fullPage: true });
  const btn = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => /contact|number/i.test(x.textContent || ""));
    return b ? b.textContent.trim() : "(no contact button)";
  });
  console.log("no-phone contact button text:", btn);
}
await browser.close();
