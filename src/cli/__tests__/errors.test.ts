// src/cli/__tests__/errors.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCaptureError, displayFailureSummary, displayCaptureSummary } from '../errors.js';
import type { ExecutionResult } from '../../engine/types.js';

describe('error formatting', () => {
  describe('formatCaptureError', () => {
    describe('DNS errors', () => {
      it('formats ERR_NAME_NOT_RESOLVED', () => {
        const result = formatCaptureError('net::ERR_NAME_NOT_RESOLVED');
        expect(result.type).toBe('dns');
        expect(result.message).toBe('Domain not found');
        expect(result.hint).toContain('URL');
      });

      it('handles case variations', () => {
        const result = formatCaptureError('NET::err_name_not_resolved');
        expect(result.type).toBe('dns');
      });
    });

    describe('SSL errors', () => {
      it('formats ERR_CERT_AUTHORITY_INVALID', () => {
        const result = formatCaptureError('net::ERR_CERT_AUTHORITY_INVALID');
        expect(result.type).toBe('ssl');
        expect(result.message).toContain('SSL');
        expect(result.hint).toContain('certificate');
      });

      it('formats ERR_CERT_DATE_INVALID', () => {
        const result = formatCaptureError('net::ERR_CERT_DATE_INVALID');
        expect(result.type).toBe('ssl');
      });
    });

    describe('connection errors', () => {
      it('formats ERR_CONNECTION_REFUSED', () => {
        const result = formatCaptureError('net::ERR_CONNECTION_REFUSED');
        expect(result.type).toBe('connection');
        expect(result.message).toBe('Connection refused');
        expect(result.hint).toContain('server');
      });

      it('formats ERR_CONNECTION_TIMED_OUT', () => {
        const result = formatCaptureError('net::ERR_CONNECTION_TIMED_OUT');
        expect(result.type).toBe('connection');
        expect(result.message).toBe('Connection failed');
      });

      it('formats ERR_CONNECTION_RESET', () => {
        const result = formatCaptureError('net::ERR_CONNECTION_RESET');
        expect(result.type).toBe('connection');
      });
    });

    describe('timeout errors', () => {
      it('formats timeout message', () => {
        const result = formatCaptureError('Timeout 30000ms exceeded');
        expect(result.type).toBe('timeout');
        expect(result.message).toContain('timed out');
        expect(result.hint).toContain('--wait');
      });

      it('handles "exceeded" keyword', () => {
        const result = formatCaptureError('Navigation exceeded timeout');
        expect(result.type).toBe('timeout');
      });
    });

    describe('HTTP errors', () => {
      it('formats 404 errors', () => {
        const result = formatCaptureError('Page returned 404');
        expect(result.type).toBe('http');
        expect(result.message).toContain('404');
        expect(result.hint).toContain('path');
      });

      it('formats 403 errors', () => {
        const result = formatCaptureError('Access forbidden 403');
        expect(result.type).toBe('http');
        expect(result.message).toContain('403');
      });

      it('formats 401 errors', () => {
        const result = formatCaptureError('Unauthorized 401');
        expect(result.type).toBe('http');
        expect(result.message).toContain('401');
        expect(result.hint).toContain('login');
      });

      it('handles "not found" text', () => {
        const result = formatCaptureError('Page not found');
        expect(result.type).toBe('http');
        expect(result.message).toContain('404');
      });
    });

    describe('URL errors', () => {
      it('formats invalid URL', () => {
        const result = formatCaptureError('Invalid URL provided');
        expect(result.type).toBe('url');
        expect(result.message).toBe('Invalid URL');
        expect(result.hint).toContain('http');
      });

      it('formats invalid protocol', () => {
        const result = formatCaptureError('Invalid protocol: ftp');
        expect(result.type).toBe('url');
      });
    });

    describe('unknown errors', () => {
      it('returns unknown type for unrecognized errors', () => {
        const result = formatCaptureError('Some random error');
        expect(result.type).toBe('unknown');
        expect(result.message).toBe('Some random error');
        expect(result.hint).toBeUndefined();
      });

      it('truncates long error messages', () => {
        const longError = 'A'.repeat(100);
        const result = formatCaptureError(longError);
        expect(result.message.length).toBeLessThanOrEqual(60);
        expect(result.message).toContain('...');
      });

      it('does not truncate short messages', () => {
        const shortError = 'Short error';
        const result = formatCaptureError(shortError);
        expect(result.message).toBe('Short error');
        expect(result.message).not.toContain('...');
      });
    });
  });

  describe('displayFailureSummary', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('does nothing when no failures', () => {
      const results: ExecutionResult[] = [
        { success: true, deviceName: 'iPhone', attempts: 1, buffer: Buffer.from('') },
      ];

      displayFailureSummary(results);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('displays failures with device names', () => {
      const results: ExecutionResult[] = [
        { success: false, deviceName: 'iPhone 14 Pro', error: 'net::ERR_NAME_NOT_RESOLVED', attempts: 1 },
      ];

      displayFailureSummary(results);

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Failures');
      expect(output).toContain('iPhone 14 Pro');
      expect(output).toContain('Domain not found');
    });

    it('displays hints for known error types', () => {
      const results: ExecutionResult[] = [
        { success: false, deviceName: 'Pixel', error: 'Timeout exceeded', attempts: 1 },
      ];

      displayFailureSummary(results);

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Hint');
    });

    it('handles multiple failures', () => {
      const results: ExecutionResult[] = [
        { success: true, deviceName: 'Success Device', attempts: 1, buffer: Buffer.from('') },
        { success: false, deviceName: 'Fail Device 1', error: 'Error 1', attempts: 1 },
        { success: false, deviceName: 'Fail Device 2', error: 'Error 2', attempts: 1 },
      ];

      displayFailureSummary(results);

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Fail Device 1');
      expect(output).toContain('Fail Device 2');
      expect(output).not.toContain('Success Device');
    });

    it('handles missing error message', () => {
      const results: ExecutionResult[] = [
        { success: false, deviceName: 'Device', attempts: 1 },
      ];

      displayFailureSummary(results);

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Unknown error');
    });
  });

  describe('displayCaptureSummary', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('shows success message when no failures', () => {
      displayCaptureSummary(10, 0);

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('10');
      expect(output).toContain('successfully');
    });

    it('shows summary with counts when failures exist', () => {
      displayCaptureSummary(8, 2);

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Summary');
      expect(output).toContain('Succeeded');
      expect(output).toContain('8');
      expect(output).toContain('Failed');
      expect(output).toContain('2');
    });
  });
});
