import type { Device, DeviceCategory } from './types.js';

// Placeholder device registry - will be populated in Phase 2
const devices: Device[] = [];

export function getDevices(): Device[] {
  return devices;
}

export function getDevicesByCategory(category: DeviceCategory): Device[] {
  return devices.filter((device) => device.category === category);
}
