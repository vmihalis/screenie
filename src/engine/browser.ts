import { chromium, Browser, BrowserContext } from 'playwright';
import type { Device } from '../devices/types.js';
import type { BrowserManagerOptions } from './types.js';
import { DEFAULT_TIMEOUT } from './types.js';

/**
 * Manages a single browser instance with multiple isolated contexts.
 *
 * Pattern: Single browser, multiple contexts - each device capture gets
 * its own isolated context with proper viewport and device emulation.
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private activeContexts: Set<BrowserContext> = new Set();
  private shutdownHandlersRegistered = false;
  private cleanupHandler: (() => Promise<void>) | null = null;

  /**
   * Launch the browser instance. Safe to call multiple times -
   * returns existing browser if already launched.
   */
  async launch(options?: BrowserManagerOptions): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await chromium.launch({
      headless: options?.headless ?? true,
    });

    this.setupShutdownHandlers();
    return this.browser;
  }

  /**
   * Create an isolated browser context configured for a specific device.
   * Automatically launches browser if not already running.
   */
  async createContext(device: Device): Promise<BrowserContext> {
    const browser = await this.launch();

    const context = await browser.newContext({
      viewport: {
        width: device.width,
        height: device.height,
      },
      deviceScaleFactor: device.deviceScaleFactor,
      userAgent: device.userAgent,
      isMobile: device.category === 'phones',
      hasTouch: device.category !== 'pc-laptops',
    });

    this.activeContexts.add(context);
    context.setDefaultNavigationTimeout(DEFAULT_TIMEOUT);

    return context;
  }

  /**
   * Close a specific context. Safe to call multiple times (idempotent).
   */
  async closeContext(context: BrowserContext): Promise<void> {
    if (this.activeContexts.has(context)) {
      await context.close();
      this.activeContexts.delete(context);
    }
  }

  /**
   * Close all contexts and the browser instance.
   * Removes shutdown handlers.
   */
  async close(): Promise<void> {
    // Close all active contexts first
    for (const context of this.activeContexts) {
      try {
        await context.close();
      } catch {
        // Context may already be closed, ignore
      }
    }
    this.activeContexts.clear();

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    // Remove shutdown handlers
    this.removeShutdownHandlers();
  }

  /**
   * Check if the browser has been launched.
   */
  isLaunched(): boolean {
    return this.browser !== null;
  }

  /**
   * Get count of active contexts (useful for debugging/testing).
   */
  getActiveContextCount(): number {
    return this.activeContexts.size;
  }

  /**
   * Setup process signal handlers for graceful shutdown.
   * Ensures browser is closed on SIGINT/SIGTERM.
   */
  private setupShutdownHandlers(): void {
    if (this.shutdownHandlersRegistered) {
      return;
    }

    this.cleanupHandler = async () => {
      await this.close();
      process.exit(0);
    };

    process.on('SIGINT', this.cleanupHandler);
    process.on('SIGTERM', this.cleanupHandler);
    this.shutdownHandlersRegistered = true;
  }

  /**
   * Remove process signal handlers.
   */
  private removeShutdownHandlers(): void {
    if (this.cleanupHandler && this.shutdownHandlersRegistered) {
      process.off('SIGINT', this.cleanupHandler);
      process.off('SIGTERM', this.cleanupHandler);
      this.cleanupHandler = null;
      this.shutdownHandlersRegistered = false;
    }
  }
}
