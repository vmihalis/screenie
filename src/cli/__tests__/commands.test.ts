import { describe, it, expect, beforeEach } from 'vitest';
import { createProgram } from '../commands.js';
import type { Command } from 'commander';

describe('CLI Command Parsing', () => {
  let program: Command;

  beforeEach(() => {
    // Create fresh program for each test (no action handler attached)
    program = createProgram();
    // Suppress exit on error for testing
    program.exitOverride();
    // Suppress output
    program.configureOutput({
      writeOut: () => {},
      writeErr: () => {},
    });
  });

  describe('required URL argument', () => {
    it('parses URL as first argument', () => {
      program.parse(['node', 'cli', 'http://localhost:3000']);
      expect(program.args[0]).toBe('http://localhost:3000');
    });

    it('throws when URL missing', () => {
      expect(() => program.parse(['node', 'cli'])).toThrow();
    });
  });

  describe('optional path argument', () => {
    it('parses path as second argument', () => {
      program.parse(['node', 'cli', 'http://localhost', '/about']);
      expect(program.args[1]).toBe('/about');
    });

    it('path is undefined when not provided', () => {
      program.parse(['node', 'cli', 'http://localhost']);
      expect(program.args[1]).toBeUndefined();
    });
  });

  describe('--pages option', () => {
    it('parses single page', () => {
      program.parse(['node', 'cli', 'http://localhost', '--pages', '/home']);
      expect(program.opts().pages).toEqual(['/home']);
    });

    it('parses multiple pages', () => {
      program.parse(['node', 'cli', 'http://localhost', '--pages', '/a', '/b', '/c']);
      expect(program.opts().pages).toEqual(['/a', '/b', '/c']);
    });
  });

  describe('--concurrency option', () => {
    it('parses short flag -c', () => {
      program.parse(['node', 'cli', 'http://localhost', '-c', '5']);
      expect(program.opts().concurrency).toBe(5);
    });

    it('parses long flag --concurrency', () => {
      program.parse(['node', 'cli', 'http://localhost', '--concurrency', '20']);
      expect(program.opts().concurrency).toBe(20);
    });

    it('is undefined when not provided', () => {
      program.parse(['node', 'cli', 'http://localhost']);
      expect(program.opts().concurrency).toBeUndefined();
    });
  });

  describe('--wait option', () => {
    it('parses short flag -w', () => {
      program.parse(['node', 'cli', 'http://localhost', '-w', '1000']);
      expect(program.opts().wait).toBe(1000);
    });

    it('parses long flag --wait', () => {
      program.parse(['node', 'cli', 'http://localhost', '--wait', '2000']);
      expect(program.opts().wait).toBe(2000);
    });
  });

  describe('device filter flags', () => {
    it('parses --phones-only', () => {
      program.parse(['node', 'cli', 'http://localhost', '--phones-only']);
      expect(program.opts().phonesOnly).toBe(true);
    });

    it('parses --tablets-only', () => {
      program.parse(['node', 'cli', 'http://localhost', '--tablets-only']);
      expect(program.opts().tabletsOnly).toBe(true);
    });

    it('parses --desktops-only', () => {
      program.parse(['node', 'cli', 'http://localhost', '--desktops-only']);
      expect(program.opts().desktopsOnly).toBe(true);
    });

    it('allows multiple device filters', () => {
      program.parse(['node', 'cli', 'http://localhost', '--phones-only', '--tablets-only']);
      expect(program.opts().phonesOnly).toBe(true);
      expect(program.opts().tabletsOnly).toBe(true);
    });

    it('all filters are undefined when not specified', () => {
      program.parse(['node', 'cli', 'http://localhost']);
      expect(program.opts().phonesOnly).toBeUndefined();
      expect(program.opts().tabletsOnly).toBeUndefined();
      expect(program.opts().desktopsOnly).toBeUndefined();
    });
  });

  describe('--output option', () => {
    it('parses short flag -o', () => {
      program.parse(['node', 'cli', 'http://localhost', '-o', './my-output']);
      expect(program.opts().output).toBe('./my-output');
    });

    it('parses long flag --output', () => {
      program.parse(['node', 'cli', 'http://localhost', '--output', '/tmp/screenshots']);
      expect(program.opts().output).toBe('/tmp/screenshots');
    });
  });

  describe('combined options', () => {
    it('parses all options together', () => {
      program.parse([
        'node', 'cli',
        'http://localhost:3000',
        '/start',
        '--pages', '/a', '/b',
        '-c', '5',
        '-w', '1000',
        '--phones-only',
        '-o', './out',
      ]);

      expect(program.args[0]).toBe('http://localhost:3000');
      expect(program.args[1]).toBe('/start');
      expect(program.opts().pages).toEqual(['/a', '/b']);
      expect(program.opts().concurrency).toBe(5);
      expect(program.opts().wait).toBe(1000);
      expect(program.opts().phonesOnly).toBe(true);
      expect(program.opts().output).toBe('./out');
    });
  });

  describe('help and version', () => {
    it('has screenie as program name', () => {
      expect(program.name()).toBe('screenie');
    });

    it('has version set', () => {
      expect(program.version()).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('has description set', () => {
      expect(program.description()).toContain('responsive');
    });
  });
});
