// End-to-end check of the real product flow in a real browser (system Chrome via playwright-core).
// Requires `npm run build` first. Starts its own server on port 3521.
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const PORT = 3521;
const BASE = `http://localhost:${PORT}`;
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
  {
    env: { ...process.env, NEXT_PUBLIC_APP_URL: BASE },
    stdio: "pipe",
  },
);
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failures++;
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start:\n${serverLog}`);
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();

  // Stub window.print so "Export to PDF" can be clicked without blocking on a real OS print dialog.
  let printCalled = false;
  await page.exposeFunction("__e2ePrintCalled", () => {
    printCalled = true;
  });
  await page.addInitScript(() => {
    window.print = () => window.__e2ePrintCalled();
  });

  // Landing
  await page.goto(BASE);
  check("landing shows the headline", (await page.locator("h1").innerText()).includes("proposal"));
  check(
    "landing has no horizontal scroll at 375px",
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  );

  // Studio app (client-only, localStorage-backed)
  await page.goto(`${BASE}/app`);
  await page.getByRole("button", { name: "Nouvelle proposition" }).click();
  check(
    "a new proposal appears in the list with the first auto-number",
    (await page.locator("main").innerText()).includes("2026-0001") ||
      (await page.locator("main").innerText()).match(/\d{4}-0001/) !== null,
  );

  await page.fill("#f-name", "Youssef A.");
  await page.fill("#c-name", "Client SARL");
  await page.fill("#p-title", "Refonte du site");
  await page.fill("#l1-d", "Design de la page d'accueil");
  await page.fill("#l1-q", "2");
  await page.fill("#l1-p", "1250,50");

  check(
    "the live preview reflects the line total without reloading",
    (await page.locator(".sheet").innerText()).includes("2 501,00 MAD"),
  );

  // Switch document language to English: both editor chrome and the live preview flip
  await page.locator("#p-lang").selectOption("en");
  check(
    "switching to English updates both the editor labels and the preview",
    (await page.locator("label[for=p-lang]").innerText()) === "Document language" &&
      (await page.locator(".sheet").innerText()).includes("PROPOSAL"),
  );

  // Missing a required field blocks export and shows an inline error. The "My business" details
  // panel auto-collapses once a name is filled in, so reopen it before clearing the field.
  await page.locator("summary", { hasText: "My business" }).click();
  await page.fill("#f-name", "");
  await page.getByRole("button", { name: "Export to PDF" }).click();
  check(
    "export is blocked and shows the English validation message when a required field is empty",
    (await page.locator('[role="status"]').innerText()).includes("Fix the highlighted fields"),
  );

  // Fix it and export for real: window.print should now fire
  await page.fill("#f-name", "Youssef A.");
  await page.getByRole("button", { name: "Export to PDF" }).click();
  await page.waitForTimeout(300);
  check("a valid proposal triggers the print/export flow", printCalled);

  // Data persists across a reload (localStorage)
  await page.reload();
  await page.getByText("Client SARL").waitFor();
  check(
    "the proposal survives a reload (localStorage)",
    (await page.locator("main").innerText()).includes("Client SARL"),
  );

  // Security headers
  const head = await fetch(BASE);
  check(
    "security headers are set",
    head.headers.get("x-content-type-options") === "nosniff" &&
      !!head.headers.get("content-security-policy") &&
      !head.headers.get("x-powered-by"),
  );
} catch (e) {
  failures++;
  console.error("FAIL  unexpected error:", e);
} finally {
  await browser?.close();
  server.kill();
  await new Promise((r) => setTimeout(r, 500));
}
console.log(failures === 0 ? "\nAll e2e checks passed." : `\n${failures} e2e check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
