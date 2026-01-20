// Progress display utilities - placeholder for Phase 9
export interface ProgressOptions {
  total: number;
  current: number;
  deviceName: string;
}

export function showProgress(options: ProgressOptions): void {
  console.log(`Capturing ${options.current}/${options.total}: ${options.deviceName}...`);
}

export function showComplete(total: number, success: number, failed: number): void {
  console.log(`Complete: ${success}/${total} succeeded, ${failed} failed`);
}
