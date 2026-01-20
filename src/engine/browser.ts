import { chromium, Browser } from 'playwright';

export class BrowserManager {
  private browser: Browser | null = null;

  async launch(): Promise<Browser> {
    this.browser = await chromium.launch();
    return this.browser;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getBrowser(): Browser | null {
    return this.browser;
  }
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch();
}
