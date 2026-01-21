import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import stripAnsi from 'strip-ansi';
import { existsSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * End-to-end tests that invoke the built CLI as a subprocess
 * These tests verify the full pipeline works correctly
 */
describe('CLI E2E', () => {
  const testOutputDir = '.test-output-e2e';
  const cliPath = './dist/cli.js';

  // Helper to invoke CLI and capture result
  async function invokeCli(args: string[]): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    try {
      const result = await execa('node', [cliPath, ...args]);
      return {
        exitCode: result.exitCode ?? 0,
        stdout: stripAnsi(result.stdout),
        stderr: stripAnsi(result.stderr),
      };
    } catch (error) {
      // execa throws on non-zero exit
      const execaError = error as {
        exitCode?: number;
        stdout?: string;
        stderr?: string;
      };
      return {
        exitCode: execaError.exitCode ?? 1,
        stdout: stripAnsi(execaError.stdout ?? ''),
        stderr: stripAnsi(execaError.stderr ?? ''),
      };
    }
  }

  beforeAll(async () => {
    // Ensure CLI is built
    await execa('npm', ['run', 'build']);

    // Clean up any previous test output
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Clean up test output
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('help and version', () => {
    it('shows help with --help', async () => {
      const result = await invokeCli(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('screenie');
      expect(result.stdout).toContain('<url>');
      expect(result.stdout).toContain('--no-open');
    });

    it('shows version with --version', async () => {
      const result = await invokeCli(['--version']);

      expect(result.exitCode).toBe(0);
      // ASCII art banner contains distinctive ASCII patterns (figlet "Big" font)
      expect(result.stdout).toContain('_____');
      // Should include version number
      expect(result.stdout).toMatch(/v\d+\.\d+\.\d+/);
      // Should include tagline
      expect(result.stdout).toContain('device viewports');
      // Should include quick-start hint
      expect(result.stdout).toContain('screenie --help');
    });

    it('shows version with -v alias', async () => {
      const result = await invokeCli(['-v']);

      expect(result.exitCode).toBe(0);
      // Should display same ASCII banner
      expect(result.stdout).toContain('_____');
      expect(result.stdout).toMatch(/v\d+\.\d+\.\d+/);
    });
  });

  describe('validation errors', () => {
    it('returns exit code 1 for missing URL', async () => {
      const result = await invokeCli([]);

      expect(result.exitCode).toBe(1); // Commander exits 1 for missing required arg
      expect(result.stderr).toContain('url');
    });

    it('returns exit code 2 for invalid URL', async () => {
      const result = await invokeCli(['invalid-url']);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Invalid');
    });

    it('returns exit code 2 for invalid concurrency', async () => {
      const result = await invokeCli([
        'https://example.com',
        '--concurrency',
        '100',
      ]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Concurrency');
    });
  });

  describe('full pipeline', () => {
    it(
      'captures screenshots and generates report',
      async () => {
        // Use example.com (stable, fast) with minimal devices for speed
        const result = await invokeCli([
          'https://example.com',
          '--phones-only',
          '--no-open', // Don't open browser in tests
          '-o',
          testOutputDir,
        ]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Report saved');
        expect(result.stdout).toContain('Done in');

        // Verify output structure
        expect(existsSync(testOutputDir)).toBe(true);

        // Find the timestamped folder
        const dirs = readdirSync(testOutputDir);
        expect(dirs.length).toBeGreaterThanOrEqual(1);

        const timestampDir = dirs[0];
        if (!timestampDir) {
          throw new Error('No timestamp directory created');
        }
        const outputPath = join(testOutputDir, timestampDir);

        // Verify category folders exist
        expect(existsSync(join(outputPath, 'phones'))).toBe(true);

        // Verify report exists
        expect(existsSync(join(outputPath, 'report.html'))).toBe(true);

        // Verify some screenshots exist in phones folder
        const phonesDir = join(outputPath, 'phones');
        const screenshots = readdirSync(phonesDir).filter((f) =>
          f.endsWith('.png')
        );
        expect(screenshots.length).toBeGreaterThan(0);
      },
      { timeout: 120000 } // 2 min timeout for real network capture
    );
  });

  describe('device filtering', () => {
    it('respects --phones-only flag', async () => {
      const outputDir = join(testOutputDir, 'phones-test');

      const result = await invokeCli([
        'https://example.com',
        '--phones-only',
        '--no-open',
        '-o',
        outputDir,
      ]);

      expect(result.exitCode).toBe(0);

      // Find timestamp folder
      const dirs = readdirSync(outputDir);
      const timestampDir = dirs[0];
      if (!timestampDir) {
        throw new Error('No timestamp directory created');
      }
      const outputPath = join(outputDir, timestampDir);

      // Only phones folder should have content
      expect(existsSync(join(outputPath, 'phones'))).toBe(true);

      // tablets and pc-laptops should be empty or not have screenshots
      const tabletsDir = join(outputPath, 'tablets');
      const desktopsDir = join(outputPath, 'pc-laptops');

      if (existsSync(tabletsDir)) {
        const tabletFiles = readdirSync(tabletsDir).filter((f) =>
          f.endsWith('.png')
        );
        expect(tabletFiles.length).toBe(0);
      }

      if (existsSync(desktopsDir)) {
        const desktopFiles = readdirSync(desktopsDir).filter((f) =>
          f.endsWith('.png')
        );
        expect(desktopFiles.length).toBe(0);
      }
    }, { timeout: 120000 });
  });
});
