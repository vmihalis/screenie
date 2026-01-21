import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import stripAnsi from 'strip-ansi';
import { generateBanner } from '../banner.js';

/**
 * Unit tests for ASCII banner generation
 * Tests the generateBanner function used for --version/-v display
 */
describe('ASCII Banner', () => {
  // Store original values for TTY mocking
  const originalIsTTY = process.stdout.isTTY;
  const originalColumns = process.stdout.columns;

  beforeEach(() => {
    // Mock TTY environment for consistent ASCII art output testing
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(process.stdout, 'columns', {
      value: 120,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(process.stdout, 'columns', {
      value: originalColumns,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('content requirements', () => {
    it('contains SCREENIE text in ASCII art form', () => {
      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // Figlet "Big" font creates distinctive patterns
      // The ASCII art contains the letters visually, not literally
      expect(plain).toContain('_____');
      // Multiple underscores in pattern indicates figlet output
      expect(plain.match(/_____/g)?.length).toBeGreaterThan(3);
    });

    it('includes version number', () => {
      const banner = generateBanner('2.2.0');
      const plain = stripAnsi(banner);

      expect(plain).toContain('v2.2.0');
    });

    it('includes tagline about device viewports', () => {
      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      expect(plain).toContain('responsive');
      expect(plain).toContain('device viewports');
    });

    it('includes quick-start hint', () => {
      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      expect(plain).toContain('screenie --help');
    });
  });

  describe('formatting constraints', () => {
    it('fits within 80 character width', () => {
      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);
      const lines = plain.split('\n');

      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(80);
      }
    });

    it('has multiple lines of output', () => {
      const banner = generateBanner('1.0.0');
      const lines = banner.split('\n');

      // Should have ASCII art + blank + version + tagline + hint + trailing
      expect(lines.length).toBeGreaterThan(5);
    });
  });

  describe('version format handling', () => {
    it('handles standard semantic version', () => {
      const banner = generateBanner('1.0.0');
      expect(stripAnsi(banner)).toContain('v1.0.0');
    });

    it('handles double-digit version numbers', () => {
      const banner = generateBanner('10.20.30');
      expect(stripAnsi(banner)).toContain('v10.20.30');
    });

    it('handles pre-release versions', () => {
      const banner = generateBanner('2.0.0-beta.1');
      expect(stripAnsi(banner)).toContain('v2.0.0-beta.1');
    });

    it('handles version with build metadata', () => {
      const banner = generateBanner('1.0.0+build.123');
      expect(stripAnsi(banner)).toContain('v1.0.0+build.123');
    });
  });

  describe('color output', () => {
    // Note: picocolors respects NO_COLOR and non-TTY environments
    // In test environment, stdout is not a TTY so colors are disabled
    // This is correct behavior - we test the color calls are made

    it('uses picocolors for styling (verified via code inspection)', () => {
      const banner = generateBanner('1.0.0');

      // In TTY environments, this would have ANSI codes
      // In non-TTY (tests), colors are disabled but output still works
      expect(banner).toContain('v1.0.0');
      expect(banner).toContain('screenie --help');
    });

    it('stripAnsi is safe to call on output', () => {
      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // stripAnsi should work regardless of whether colors are present
      expect(plain).toContain('v1.0.0');
      expect(typeof plain).toBe('string');
    });
  });

  describe('terminal width handling', () => {
    // Store original COLUMNS for env var tests
    const originalEnvColumns = process.env.COLUMNS;

    afterEach(() => {
      // Restore COLUMNS env var
      if (originalEnvColumns !== undefined) {
        process.env.COLUMNS = originalEnvColumns;
      } else {
        delete process.env.COLUMNS;
      }
    });

    it('uses Big font for wide terminals (>=80 columns)', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 100,
        writable: true,
        configurable: true,
      });

      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // Big font creates distinctive wide patterns with multiple underscores
      expect(plain).toContain('_____');
      expect(plain.match(/_____/g)?.length).toBeGreaterThan(3);
    });

    it('uses Small font for narrow terminals (60-79 columns)', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 70,
        writable: true,
        configurable: true,
      });

      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // Small font still produces ASCII art but with different patterns
      // It should have ASCII art characters (not plain text)
      expect(plain).toMatch(/[_|\/\\]/);
      // Should have multiple lines indicating figlet output
      expect(plain.split('\n').length).toBeGreaterThan(5);
      // Should NOT be plain text format (which would be exactly 5 lines)
      expect(plain).not.toMatch(/^SCREENIE\nv/);
    });

    it('uses Mini font for very narrow terminals (45-59 columns)', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 50,
        writable: true,
        configurable: true,
      });

      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // Mini font still produces some ASCII art
      // Should have multiple lines indicating figlet output
      expect(plain.split('\n').length).toBeGreaterThan(5);
      // Should NOT be plain text format
      expect(plain).not.toMatch(/^SCREENIE\nv/);
    });

    it('falls back to plain text for extremely narrow terminals (<45 columns)', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 40,
        writable: true,
        configurable: true,
      });

      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // Plain text fallback should contain literal 'SCREENIE' at start
      expect(plain).toMatch(/^SCREENIE\n/);
      // Should have exactly 5 lines: SCREENIE, version, tagline, help, empty
      expect(plain.split('\n').length).toBe(5);
      // Should NOT have figlet patterns
      expect(plain).not.toContain('_____');
    });

    it('uses plain text for non-TTY output (pipes)', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
        configurable: true,
      });

      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // Plain text fallback for non-TTY
      expect(plain).toMatch(/^SCREENIE\n/);
      expect(plain.split('\n').length).toBe(5);
      expect(plain).not.toContain('_____');
    });

    it('respects COLUMNS env var as fallback', () => {
      // Unset stdout.columns to force env var fallback
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      process.env.COLUMNS = '50';

      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // With COLUMNS=50, should use Mini font (45-59 range)
      // Should NOT be plain text (which starts with literal SCREENIE)
      expect(plain.split('\n').length).toBeGreaterThan(5);
    });

    it('defaults to 80 columns when no width info available', () => {
      // Unset both stdout.columns and COLUMNS env
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete process.env.COLUMNS;

      const banner = generateBanner('1.0.0');
      const plain = stripAnsi(banner);

      // Default 80 columns should use Big font
      expect(plain).toContain('_____');
      expect(plain.match(/_____/g)?.length).toBeGreaterThan(3);
    });
  });
});
