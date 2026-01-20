import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { scrollForLazyContent } from '../scroll.js';

describe('scrollForLazyContent', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  // Helper to create fresh page for each test
  async function createPage(): Promise<Page> {
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
    });
    return context.newPage();
  }

  describe('basic operation', () => {
    it('should scroll through page content', async () => {
      page = await createPage();

      // Create a page with scrollable content
      await page.setContent(`
        <html>
          <body style="margin: 0;">
            <div style="height: 3000px; background: linear-gradient(red, blue);">
              Content
            </div>
          </body>
        </html>
      `);

      // Scroll should complete without error
      await scrollForLazyContent(page, 10, 5000);

      // Should return to top after scrolling
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      await page.context().close();
    });

    it('should return to top after scrolling', async () => {
      page = await createPage();

      await page.setContent(`
        <html>
          <body style="margin: 0;">
            <div style="height: 2000px;">Content</div>
          </body>
        </html>
      `);

      await scrollForLazyContent(page, 5, 3000);

      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      await page.context().close();
    });
  });

  describe('iteration limits', () => {
    it('should stop at max iterations', async () => {
      page = await createPage();

      // Static page - should complete quickly with 1-2 iterations
      await page.setContent(`
        <html>
          <body style="margin: 0;">
            <div style="height: 1500px;">Static content</div>
          </body>
        </html>
      `);

      const start = Date.now();
      await scrollForLazyContent(page, 3, 10000);
      const duration = Date.now() - start;

      // Should complete well under timeout since page is static
      expect(duration).toBeLessThan(5000);

      await page.context().close();
    });

    it('should respect timeout budget', async () => {
      page = await createPage();

      await page.setContent(`
        <html>
          <body style="margin: 0;">
            <div style="height: 5000px;">Tall content</div>
          </body>
        </html>
      `);

      const start = Date.now();
      await scrollForLazyContent(page, 100, 1000); // Short timeout
      const duration = Date.now() - start;

      // Should stop around timeout, with some tolerance for execution time
      expect(duration).toBeLessThan(2000);

      await page.context().close();
    });
  });

  describe('height stabilization', () => {
    it('should stop early if page height stabilizes', async () => {
      page = await createPage();

      // Static page - height won't change
      await page.setContent(`
        <html>
          <body style="margin: 0;">
            <div style="height: 1200px;">Static</div>
          </body>
        </html>
      `);

      const start = Date.now();
      await scrollForLazyContent(page, 10, 10000);
      const duration = Date.now() - start;

      // Should complete quickly since height doesn't change after first scroll
      expect(duration).toBeLessThan(3000);

      await page.context().close();
    });
  });

  describe('short pages', () => {
    it('should handle pages shorter than viewport', async () => {
      page = await createPage();

      await page.setContent(`
        <html>
          <body style="margin: 0;">
            <div style="height: 100px;">Short</div>
          </body>
        </html>
      `);

      // Should not error on short pages
      await scrollForLazyContent(page, 10, 5000);

      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);

      await page.context().close();
    });
  });
});
