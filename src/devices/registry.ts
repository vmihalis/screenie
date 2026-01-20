import type { Device, DeviceCategory } from './types.js';
import { phones } from './phones.js';
import { tablets } from './tablets.js';
import { desktops } from './desktops.js';

/**
 * Combined device registry containing all phones, tablets, and desktops.
 */
const devices: readonly Device[] = [...phones, ...tablets, ...desktops];

export function getDevices(): Device[] {
  return [...devices];
}

export function getDevicesByCategory(category: DeviceCategory): Device[] {
  return devices.filter((device) => device.category === category);
}
