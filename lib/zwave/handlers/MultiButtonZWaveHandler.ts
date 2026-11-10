import type ShellyZWaveDevice from '../ZWaveDevice.js';
import * as ButtonZWaveHandler from './ButtonZWaveHandler.js';
import { safeAddCapability, safeRemoveCapability } from '../../safeFunctions.js';

export async function configureDevice(device: ShellyZWaveDevice, buttonCount: number): Promise<void> {
  await ButtonZWaveHandler.configureDevice(device);

  const settings: Record<string, string> = {};

  try {
    const switchTypeResponse = await device.getConfigurationBulk(1, buttonCount);
    const switchDetachedResponses = await device.getConfigurationBulk(7, buttonCount);

    let anyButtonReportsButtonPresses = false;

    for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
      const buttonDetachedMode = switchDetachedResponses[buttonIndex].readUInt8();
      const switchType = switchTypeResponse[buttonIndex].readUInt8();

      const detached = buttonDetachedMode === 1;
      const momentary = switchType === 0;

      settings[`zwaveSwitchTypeSW${buttonIndex + 1}`] = switchType.toFixed();
      settings[`zwaveSwitchDetachedModeSW${buttonIndex + 1}`] = buttonDetachedMode.toFixed();

      anyButtonReportsButtonPresses ||= detached && momentary;
    }

    if (anyButtonReportsButtonPresses) {
      await safeAddCapability(device, 'hidden.button_pressed');
    } else {
      await safeRemoveCapability(device, 'hidden.button_pressed');
    }

    await device.setSettings(settings);
  } catch (err) {
    device.error('Error while getting initial setting values:', err);
  }
}

export async function onSettings(
  device: ShellyZWaveDevice,
  { changedKeys, newSettings }: SettingsEvent<Record<string, boolean | string | number | undefined | null>>,
  buttonCount: number,
): Promise<string | void> {
  for (const changedKey of changedKeys) {
    if (changedKey.startsWith('zwaveSwitchDetachedModeSW') || changedKey.startsWith('zwaveSwitchTypeSW')) {
      let anyButtonReportsButtonPresses = false;

      for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
        const detached = newSettings[`zwaveSwitchDetachedModeSW${buttonIndex + 1}`] === '1';
        const momentary = newSettings[`zwaveSwitchTypeSW${buttonIndex + 1}`] === '0';
        anyButtonReportsButtonPresses ||= detached && momentary;
      }

      if (anyButtonReportsButtonPresses) {
        await safeAddCapability(device, 'hidden.button_pressed');
      } else {
        await safeRemoveCapability(device, 'hidden.button_pressed');
      }

      break;
    }
  }
}
