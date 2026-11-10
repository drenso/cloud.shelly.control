import type ShellyZWaveDevice from '../ZWaveDevice.js';
import * as ButtonZWaveHandler from './ButtonZWaveHandler.js';
import { safeAddCapability, safeRemoveCapability } from '../../safeFunctions.js';

export async function configureDevice(
  device: ShellyZWaveDevice,
  buttonCount: number,
  { noDetachedSetting = false } = {},
): Promise<void> {
  await ButtonZWaveHandler.configureDevice(device);

  const settings: Record<string, string> = {};

  try {
    const switchTypeResponse = await device.getConfigurationBulk(1, buttonCount);
    const switchDetachedResponses = noDetachedSetting ? [] : await device.getConfigurationBulk(7, buttonCount);

    let anyButtonReportsButtonPresses = false;

    for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
      const buttonDetachedMode = noDetachedSetting ? 1 : switchDetachedResponses[buttonIndex].readUInt8();
      const switchType = switchTypeResponse[buttonIndex].readUInt8();

      const detached = buttonDetachedMode === 1;
      const momentary = switchType === 0;

      settings[`zwaveSwitchTypeSW${buttonIndex + 1}`] = switchType.toFixed();
      settings[`zwaveSwitchDetachedModeSW${buttonIndex + 1}`] = buttonDetachedMode.toFixed();

      anyButtonReportsButtonPresses ||= detached && momentary;
    }

    if (anyButtonReportsButtonPresses) {
      await safeAddCapability(device, buttonCount === 1 ? 'hidden.single_button_pressed' : 'hidden.button_pressed');
    } else {
      await safeRemoveCapability(device, buttonCount === 1 ? 'hidden.single_button_pressed' : 'hidden.button_pressed');
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
  { noDetachedSetting = false } = {},
): Promise<string | void> {
  for (const changedKey of changedKeys) {
    if (!changedKey.startsWith('zwaveSwitchDetachedModeSW') && !changedKey.startsWith('zwaveSwitchTypeSW')) {
      continue;
    }

    let anyButtonReportsButtonPresses = false;

    for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
      const detached = noDetachedSetting ? true : newSettings[`zwaveSwitchDetachedModeSW${buttonIndex + 1}`] === '1';
      const momentary = newSettings[`zwaveSwitchTypeSW${buttonIndex + 1}`] === '0';
      anyButtonReportsButtonPresses ||= detached && momentary;
    }

    if (anyButtonReportsButtonPresses) {
      await safeAddCapability(device, buttonCount === 1 ? 'hidden.single_button_pressed' : 'hidden.button_pressed');
    } else {
      await safeRemoveCapability(device, buttonCount === 1 ? 'hidden.single_button_pressed' : 'hidden.button_pressed');
    }

    break;
  }
}
