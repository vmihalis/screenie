export type DeviceCategory = 'phones' | 'tablets' | 'pc-laptops';

export interface Device {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  category: DeviceCategory;
  userAgent?: string;
}
