import type ShellyZWaveDevice from '../ZWaveDevice.js';
import * as MultiButtonZWaveHandler from './MultiButtonZWaveHandler.js';

export async function configureDevice(device: ShellyZWaveDevice): Promise<void> {
  await MultiButtonZWaveHandler.configureDevice(device, 1);
}

export async function onSettings(
  device: ShellyZWaveDevice,
  event: SettingsEvent<Record<string, boolean | string | number | undefined | null>>,
): Promise<string | void> {
  await MultiButtonZWaveHandler.onSettings(device, event, 1);
}
