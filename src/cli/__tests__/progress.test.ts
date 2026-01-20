import { describe, it, expect } from 'vitest';
import { createSpinner } from '../progress.js';

describe('progress spinner', () => {
  describe('createSpinner', () => {
    it('returns ProgressSpinner interface', () => {
      const spinner = createSpinner();
      expect(spinner).toHaveProperty('start');
      expect(spinner).toHaveProperty('update');
      expect(spinner).toHaveProperty('succeed');
      expect(spinner).toHaveProperty('warn');
      expect(spinner).toHaveProperty('stop');
      expect(spinner).toHaveProperty('isSpinning');
    });

    it('isSpinning is false initially', () => {
      const spinner = createSpinner();
      expect(spinner.isSpinning).toBe(false);
    });

    // Note: In non-TTY environments (like CI/vitest), ora disables animation
    // and isSpinning returns false. We test that start doesn't throw.
    it('start does not throw', () => {
      const spinner = createSpinner();
      expect(() => spinner.start(10)).not.toThrow();
      spinner.stop(); // cleanup
    });

    // Note: isSpinning is false in non-TTY after succeed because ora never truly "spins"
    it('isSpinning is false after succeed', () => {
      const spinner = createSpinner();
      spinner.start(10);
      spinner.succeed(10);
      expect(spinner.isSpinning).toBe(false);
    });

    it('isSpinning is false after warn', () => {
      const spinner = createSpinner();
      spinner.start(10);
      spinner.warn(8, 2);
      expect(spinner.isSpinning).toBe(false);
    });

    it('isSpinning is false after stop', () => {
      const spinner = createSpinner();
      spinner.start(10);
      spinner.stop();
      expect(spinner.isSpinning).toBe(false);
    });

    it('update is safe when not started', () => {
      const spinner = createSpinner();
      // Should not throw
      expect(() => spinner.update(1, 10, 'iPhone', true)).not.toThrow();
    });

    it('succeed is safe when not started', () => {
      const spinner = createSpinner();
      // Should not throw
      expect(() => spinner.succeed(10)).not.toThrow();
    });

    it('warn is safe when not started', () => {
      const spinner = createSpinner();
      // Should not throw
      expect(() => spinner.warn(8, 2)).not.toThrow();
    });

    it('stop is safe when not started', () => {
      const spinner = createSpinner();
      // Should not throw
      expect(() => spinner.stop()).not.toThrow();
    });

    it('can be reused after succeed without error', () => {
      const spinner = createSpinner();
      spinner.start(10);
      spinner.succeed(10);
      // Can start again without throwing
      expect(() => spinner.start(20)).not.toThrow();
      spinner.stop();
    });

    it('can be reused after warn without error', () => {
      const spinner = createSpinner();
      spinner.start(10);
      spinner.warn(8, 2);
      // Can start again without throwing
      expect(() => spinner.start(15)).not.toThrow();
      spinner.stop();
    });

    it('multiple starts without stop does not throw', () => {
      const spinner = createSpinner();
      spinner.start(10);
      expect(() => spinner.start(20)).not.toThrow();
      spinner.stop();
    });

    it('update after start does not throw', () => {
      const spinner = createSpinner();
      spinner.start(10);
      expect(() => spinner.update(5, 10, 'iPhone 14 Pro', true)).not.toThrow();
      expect(() => spinner.update(6, 10, 'Samsung Galaxy', false)).not.toThrow();
      spinner.stop();
    });
  });
});
