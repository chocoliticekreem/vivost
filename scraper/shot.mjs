import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BASE = "http://localhost:3000";
const SHOTS = fileURLToPath(new URL("./shots/", import.meta.url));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("age-confirmed", "true"); } catch {}
  });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("  console.error:", m.text().slice(0, 200)); });

  await mkdir(SHOTS, { recursive: true });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOTS + "home.png", fullPage: true });
  console.log("home.png saved");

  const href = await page.evaluate(() => {
    const a = document.querySelector('a[href^="/profile/"]');
    return a ? a.getAttribute("href") : null;
  });
  console.log("first profile link:", href);

  if (href) {
    await page.goto(BASE + href, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: SHOTS + "detail.png", fullPage: true });
    console.log("detail.png saved");

    // Reveal contact and screenshot the sidebar state.
    try {
      await page.getByText("Show contact details").click({ timeout: 3000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: SHOTS + "detail-contact.png", fullPage: true });
      console.log("detail-contact.png saved");
    } catch (e) {
      console.log("contact reveal skipped:", e.message);
    }
  }

  await browser.close();
}

main();
