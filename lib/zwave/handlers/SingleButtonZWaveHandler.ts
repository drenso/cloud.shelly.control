import type ShellyZWaveDevice from '../ZWaveDevice.js';
import { safeAddCapability, safeRemoveCapability } from '../../safeFunctions.js';
import * as ButtonZWaveHandler from './ButtonZWaveHandler.js';

export async function configureDevice(device: ShellyZWaveDevice): Promise<void> {
  await ButtonZWaveHandler.configureDevice(device);

  try {
    const switchTypeResponse = await device.getConfigurationBulk(1, 1);
    const switchDetachedResponse = await device.getConfigurationBulk(7, 1);

    const switchType = switchTypeResponse[0].readUInt8();
    const detachedMode = switchDetachedResponse[0].readUInt8();

    const momentary = switchType === 0;
    const detached = detachedMode === 1;

    const reportsPresses = detached && momentary;

    if (reportsPresses) {
      await safeAddCapability(device, 'hidden.single_button_pressed');
    } else {
      await safeRemoveCapability(device, 'hidden.single_button_pressed');
    }
    await device.setSettings({
      zwaveSwitchTypeSW1: switchType.toFixed(),
      zwaveSwitchDetachedModeSW1: detachedMode.toFixed(),
    });
  } catch (err) {
    device.error('Error while getting initial detached input setting:', err);
  }
}

export async function onSettings(
  device: ShellyZWaveDevice,
  { changedKeys, newSettings }: SettingsEvent<Record<string, boolean | string | number | undefined | null>>,
): Promise<string | void> {
  if (changedKeys.includes('zwaveSwitchTypeSW1') || changedKeys.includes('zwaveSwitchDetachedModeSW1')) {
    const momentary = newSettings['zwaveSwitchTypeSW1'] === '0';
    const detached = newSettings['zwaveSwitchDetachedModeSW1'] === '1';
    const reportsPresses = detached && momentary;

    if (reportsPresses) {
      await safeAddCapability(device, 'hidden.single_button_pressed');
    } else {
      await safeRemoveCapability(device, 'hidden.single_button_pressed');
    }
  }
}
