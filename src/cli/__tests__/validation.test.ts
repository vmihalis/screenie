import { describe, it, expect } from 'vitest';
import {
  validateUrl,
  validateConcurrency,
  validateWait,
  selectDevices,
  resolvePages,
  buildFullUrl,
} from '../validation.js';
import { getDevices, getDevicesByCategory } from '../../devices/index.js';

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('accepts http URL', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result).toBeInstanceOf(URL);
      expect(result.href).toBe('http://localhost:3000/');
    });

    it('accepts https URL', () => {
      const result = validateUrl('https://example.com');
      expect(result).toBeInstanceOf(URL);
      expect(result.protocol).toBe('https:');
    });

    it('accepts URL with path', () => {
      const result = validateUrl('http://localhost:3000/app');
      expect(result.pathname).toBe('/app');
    });

    it('accepts URL with port', () => {
      const result = validateUrl('http://localhost:8080');
      expect(result.port).toBe('8080');
    });

    it('accepts IP address URL', () => {
      const result = validateUrl('http://192.168.1.1:3000');
      expect(result.hostname).toBe('192.168.1.1');
    });
  });

  describe('invalid URLs', () => {
    it('rejects malformed URL', () => {
      expect(() => validateUrl('not-a-url')).toThrow(/Invalid URL/);
    });

    it('rejects URL without protocol', () => {
      // localhost:3000 is parsed as protocol "localhost:" which is invalid
      expect(() => validateUrl('localhost:3000')).toThrow(/Invalid protocol/);
    });

    it('rejects empty string', () => {
      expect(() => validateUrl('')).toThrow(/Invalid URL/);
    });

    it('provides helpful example in error', () => {
      expect(() => validateUrl('bad')).toThrow(/Example:/);
    });
  });

  describe('protocol validation', () => {
    it('rejects ftp protocol', () => {
      expect(() => validateUrl('ftp://example.com')).toThrow(/Invalid protocol/);
    });

    it('rejects file protocol', () => {
      expect(() => validateUrl('file:///path/to/file')).toThrow(/Invalid protocol/);
    });

    it('includes protocol in error message', () => {
      expect(() => validateUrl('ftp://example.com')).toThrow(/ftp:/);
    });
  });
});

describe('validateConcurrency', () => {
  describe('valid values', () => {
    it('accepts minimum value (1)', () => {
      expect(validateConcurrency(1)).toBe(1);
    });

    it('accepts maximum value (50)', () => {
      expect(validateConcurrency(50)).toBe(50);
    });

    it('accepts middle value', () => {
      expect(validateConcurrency(10)).toBe(10);
    });

    it('returns default when undefined', () => {
      expect(validateConcurrency(undefined)).toBe(10);
    });
  });

  describe('invalid values', () => {
    it('rejects zero', () => {
      expect(() => validateConcurrency(0)).toThrow(/between 1 and 50/);
    });

    it('rejects negative', () => {
      expect(() => validateConcurrency(-1)).toThrow(/between 1 and 50/);
    });

    it('rejects over maximum', () => {
      expect(() => validateConcurrency(51)).toThrow(/between 1 and 50/);
    });

    it('rejects non-integer', () => {
      expect(() => validateConcurrency(5.5)).toThrow(/integer/);
    });

    it('includes provided value in error', () => {
      expect(() => validateConcurrency(100)).toThrow(/100/);
    });
  });
});

describe('validateWait', () => {
  describe('valid values', () => {
    it('accepts zero', () => {
      expect(validateWait(0)).toBe(0);
    });

    it('accepts positive integer', () => {
      expect(validateWait(1000)).toBe(1000);
    });

    it('accepts positive float', () => {
      expect(validateWait(500.5)).toBe(500.5);
    });

    it('returns default when undefined', () => {
      expect(validateWait(undefined)).toBe(500);
    });
  });

  describe('invalid values', () => {
    it('rejects negative', () => {
      expect(() => validateWait(-100)).toThrow(/positive number/);
    });

    it('rejects NaN', () => {
      expect(() => validateWait(NaN)).toThrow(/positive number/);
    });

    it('rejects Infinity', () => {
      expect(() => validateWait(Infinity)).toThrow(/positive number/);
    });
  });
});

describe('selectDevices', () => {
  it('returns all devices when no filters', () => {
    const devices = selectDevices({});
    const allDevices = getDevices();
    expect(devices.length).toBe(allDevices.length);
  });

  it('returns only phones with --phones-only', () => {
    const devices = selectDevices({ phonesOnly: true });
    const phones = getDevicesByCategory('phones');
    expect(devices.length).toBe(phones.length);
    expect(devices.every((d) => d.category === 'phones')).toBe(true);
  });

  it('returns only tablets with --tablets-only', () => {
    const devices = selectDevices({ tabletsOnly: true });
    const tablets = getDevicesByCategory('tablets');
    expect(devices.length).toBe(tablets.length);
    expect(devices.every((d) => d.category === 'tablets')).toBe(true);
  });

  it('returns only desktops with --desktops-only', () => {
    const devices = selectDevices({ desktopsOnly: true });
    const desktops = getDevicesByCategory('pc-laptops');
    expect(devices.length).toBe(desktops.length);
    expect(devices.every((d) => d.category === 'pc-laptops')).toBe(true);
  });

  it('returns union with multiple filters', () => {
    const devices = selectDevices({ phonesOnly: true, tabletsOnly: true });
    const phones = getDevicesByCategory('phones');
    const tablets = getDevicesByCategory('tablets');
    expect(devices.length).toBe(phones.length + tablets.length);
  });

  it('returns all three categories when all filters specified', () => {
    const devices = selectDevices({
      phonesOnly: true,
      tabletsOnly: true,
      desktopsOnly: true,
    });
    const allDevices = getDevices();
    expect(devices.length).toBe(allDevices.length);
  });
});

describe('resolvePages', () => {
  it('returns ["/"] when no path or pages', () => {
    expect(resolvePages(undefined, undefined)).toEqual(['/']);
  });

  it('uses path argument when provided', () => {
    expect(resolvePages('/about', undefined)).toEqual(['/about']);
  });

  it('adds leading slash to path if missing', () => {
    expect(resolvePages('about', undefined)).toEqual(['/about']);
  });

  it('prefers --pages over path argument', () => {
    expect(resolvePages('/ignored', ['/a', '/b'])).toEqual(['/a', '/b']);
  });

  it('adds leading slash to pages if missing', () => {
    expect(resolvePages(undefined, ['a', 'b'])).toEqual(['/a', '/b']);
  });

  it('handles empty pages array', () => {
    expect(resolvePages(undefined, [])).toEqual(['/']);
  });
});

describe('buildFullUrl', () => {
  it('combines base URL and path', () => {
    const base = new URL('http://localhost:3000');
    expect(buildFullUrl(base, '/about')).toBe('http://localhost:3000/about');
  });

  it('replaces existing path', () => {
    const base = new URL('http://localhost:3000/old');
    expect(buildFullUrl(base, '/new')).toBe('http://localhost:3000/new');
  });

  it('preserves port', () => {
    const base = new URL('http://localhost:8080');
    expect(buildFullUrl(base, '/test')).toBe('http://localhost:8080/test');
  });

  it('preserves protocol', () => {
    const base = new URL('https://example.com');
    expect(buildFullUrl(base, '/secure')).toBe('https://example.com/secure');
  });
});
