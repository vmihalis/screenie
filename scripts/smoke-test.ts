import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

async function smokeTest() {
  console.log('Starting Playwright smoke test...');

  // Ensure output directory exists
  const outputDir = join(process.cwd(), 'screenshots', 'smoke-test');
  await mkdir(outputDir, { recursive: true });

  // Launch browser
  console.log('Launching Chromium...');
  const browser = await chromium.launch();

  // Create context with mobile viewport
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3
  });

  // Navigate and screenshot
  const page = await context.newPage();
  console.log('Navigating to example.com...');
  await page.goto('https://example.com');
  await page.waitForLoadState('networkidle');

  const screenshotPath = join(outputDir, 'smoke-test-screenshot.png');
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });
  console.log(`Screenshot saved: ${screenshotPath}`);

  // Cleanup
  await context.close();
  await browser.close();

  console.log('Smoke test completed successfully!');
}

smokeTest().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
