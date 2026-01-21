// CLI entry point for responsive-capture
// Note: shebang added via tsup banner config

import { program } from './commands.js';
import { runCapture, handleError } from './actions.js';
import { generateBanner } from './banner.js';
import type { CLIOptions } from './types.js';
import updateNotifier from 'update-notifier';

declare const __PKG_NAME__: string;
declare const __PKG_VERSION__: string;

// Handle version flags before Commander parsing
// This allows --version/-v to work without requiring <url> argument
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(generateBanner(__PKG_VERSION__));
  process.exit(0);
}

// Check for updates (non-blocking, cached for 1 day)
updateNotifier({ pkg: { name: __PKG_NAME__, version: __PKG_VERSION__ } }).notify();

// Connect action handler to program
program.action(async (url: string, path: string | undefined, options: CLIOptions) => {
  try {
    await runCapture(url, path, options);
  } catch (error) {
    handleError(error);
  }
});

// Parse arguments and run
program.parse();

// Re-exports for testing and programmatic use
export type { CLIOptions, ValidatedConfig } from './types.js';
export {
  validateUrl,
  validateConcurrency,
  validateWait,
  selectDevices,
  resolvePages,
  buildFullUrl,
  validateConfig,
} from './validation.js';
export { createProgram, program } from './commands.js';
export { runCapture, handleError } from './actions.js';
