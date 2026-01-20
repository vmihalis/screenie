// Console logging utilities
export function log(message: string): void {
  console.log(message);
}

export function error(message: string): void {
  console.error(message);
}

export function info(message: string): void {
  console.info(message);
}

export function success(message: string): void {
  console.log(`\x1b[32m${message}\x1b[0m`);
}

export function warn(message: string): void {
  console.warn(`\x1b[33m${message}\x1b[0m`);
}
