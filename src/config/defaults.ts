import type { Config } from './types.js';

export const defaultConfig: Config = {
  outputDir: './screenshots',
  concurrency: 10,
  timeout: 30000,
  waitBuffer: 500,
};
