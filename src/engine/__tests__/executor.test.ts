import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { isRetryableError, captureWithRetry, captureAllDevices } from '../executor.js';
import { BrowserManager } from '../browser.js';
import { DEFAULT_TIMEOUT } from '../types.js';
import type { Device } from '../../devices/types.js';

// Test device fixtures
const testPhone: Device = {
  name: 'Test iPhone',
  width: 390,
  height: 844,
  deviceScaleFactor: 3,
  category: 'phones',
};

const testDesktop: Device = {
  name: 'Test Desktop',
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  category: 'pc-laptops',
};

describe('executor', () => {
  describe('isRetryableError', () => {
    it('should return false for undefined error', () => {
      expect(isRetryableError(undefined)).toBe(false);
    });

    it('should return false for DNS resolution errors', () => {
      expect(isRetryableError('net::ERR_NAME_NOT_RESOLVED')).toBe(false);
    });

    it('should return false for SSL certificate errors', () => {
      expect(isRetryableError('net::ERR_CERT_AUTHORITY_INVALID')).toBe(false);
      expect(isRetryableError('net::ERR_CERT_DATE_INVALID')).toBe(false);
    });

    it('should return false for invalid URL errors', () => {
      expect(isRetryableError('invalid url')).toBe(false);
      expect(isRetryableError('Invalid URL')).toBe(false); // case insensitive
    });

    it('should return false for HTTP 4xx errors', () => {
      expect(isRetryableError('404 Not Found')).toBe(false);
      expect(isRetryableError('403 Forbidden')).toBe(false);
      expect(isRetryableError('401 Unauthorized')).toBe(false);
    });

    it('should return true for timeout errors', () => {
      expect(isRetryableError('Timeout 30000ms exceeded')).toBe(true);
      expect(isRetryableError('Navigation timeout')).toBe(true);
    });

    it('should return true for connection reset errors', () => {
      expect(isRetryableError('net::ERR_CONNECTION_RESET')).toBe(true);
    });

    it('should return true for temporary server errors', () => {
      expect(isRetryableError('503 Service Unavailable')).toBe(true);
      expect(isRetryableError('502 Bad Gateway')).toBe(true);
    });

    it('should return true for generic network errors', () => {
      expect(isRetryableError('Network error')).toBe(true);
    });
  });
});
