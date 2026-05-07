/**
 * Capture real product screenshots for the README and the wiki via Playwright.
 *
 * Prerequisites:
 *   - The dev server is running (`npm run dev`) at http://localhost:5173
 *   - Chromium is installed (`npx playwright install chromium`)
 *
 * Run:
 *   npm run screenshots
 *
 * Output: docs/screenshots/*.png
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "docs/screenshots");
const URL = process.env.ARCHITECT_URL || "http://localhost:5173/";

const VIEWPORT = { width: 1440, height: 900 };
const DEVICE_SCALE = 2; // retina sharpness

async function shot(page, name, opts = {}) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: false, ...opts });
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${name}.png`);
}

async function clearLocalStorage(page) {
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      // noop
    }
  });
}

async function settleApp(page) {
  // Wait for the React app + initial fonts/network to settle.
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(700);
}

async function dismissWelcome(page) {
  // The X button at the top-right of the welcome modal has aria-label "Skip welcome"
  const closeBtn = page.getByRole("button", { name: /Skip welcome/i });
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(300);
    return;
  }
  // Fallback to "Skip intro" on first step
  const skip = page.getByRole("button", { name: /Skip intro/i });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await page.waitForTimeout(300);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log(`Architect screenshot run`);
  console.log(`  url:      ${URL}`);
  console.log(`  out:      ${OUT}`);
  console.log(`  viewport: ${VIEWPORT.width}×${VIEWPORT.height} @ ${DEVICE_SCALE}x\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    colorScheme: "dark",
  });
  const page = await context.newPage();

  page.on("pageerror", (err) => console.error(`[page error] ${err.message}`));

  console.log("• Welcome wizard");
  await page.goto(URL);
  await clearLocalStorage(page);
  await page.reload();
  await settleApp(page);
  await shot(page, "welcome");

  // Step through the wizard for a second hero shot
  await page
    .getByRole("button", { name: /Get started/i })
    .click()
    .catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, "welcome-features");

  console.log("• Dashboard");
  await dismissWelcome(page);
  // After welcome we land on dashboard
  await page.waitForTimeout(400);
  await shot(page, "dashboard");

  console.log("• Editor — canvas");
  // Click a project card to open the editor
  const card = page.locator(".proj-card-pro:not(.new)").first();
  if (await card.isVisible().catch(() => false)) {
    await card.click();
    await page.waitForTimeout(500);
  }
  await shot(page, "editor");

  console.log("• Templates");
  await page
    .locator(".nav-item", { hasText: "Templates" })
    .click()
    .catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, "templates");

  console.log("• Settings");
  await page
    .locator(".nav-item", { hasText: "Settings" })
    .click()
    .catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, "settings");

  console.log("• Export modal (⌘E from editor)");
  await page
    .locator(".nav-item", { hasText: "Editor" })
    .click()
    .catch(() => {});
  await page.waitForTimeout(400);
  await page.keyboard.press("Meta+E");
  await page.waitForTimeout(500);
  await shot(page, "export");
  // Close modal
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  console.log("• Handoff package");
  // Open via toolrail
  await page
    .locator(".tool", { hasText: "Handoff" })
    .click()
    .catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, "handoff");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  console.log("• Claude Code chat");
  await page
    .locator(".tool", { hasText: "Chat" })
    .click()
    .catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, "claude-chat");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  console.log("• New project wizard");
  // Trigger via Cmd+K and select "Create new project"
  await page.keyboard.press("Meta+K");
  await page.waitForTimeout(400);
  // Type to filter
  await page.keyboard.type("create");
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  await shot(page, "new-project-wizard");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  console.log("• Command palette");
  await page.keyboard.press("Meta+K");
  await page.waitForTimeout(400);
  await shot(page, "command-palette");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  console.log("• Light theme variants — dashboard + editor");
  // Open the Tweaks panel via host protocol
  await page.evaluate(() => window.postMessage({ type: "__activate_edit_mode" }, "*"));
  await page.waitForTimeout(400);
  // Try to switch theme to light by clicking the radio segment
  const lightBtn = page.locator(".twk-seg button", { hasText: /^Light$/ });
  if (await lightBtn.isVisible().catch(() => false)) {
    await lightBtn.click();
    await page.waitForTimeout(400);
  }
  // Dismiss tweaks panel
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // Dashboard light
  await page
    .locator(".nav-item", { hasText: "Dashboard" })
    .click()
    .catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, "dashboard-light");

  // Editor light
  const card2 = page.locator(".proj-card-pro:not(.new)").first();
  if (await card2.isVisible().catch(() => false)) {
    await card2.click();
    await page.waitForTimeout(500);
  }
  await shot(page, "editor-light");

  await browser.close();
  console.log(`\n✓ Done — saved to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
