import type ShellyZWaveDevice from '../ZWaveDevice.js';
import * as ButtonZWaveHandler from './ButtonZWaveHandler.js';
import * as SwitchZWaveHandler from './SwitchZWaveHandler.js';
import { safeAddCapability, safeRemoveCapability } from '../../safeFunctions.js';

export async function configureDevice(
  device: ShellyZWaveDevice,
  buttonCount: number,
  { noDetachedSetting = false } = {},
): Promise<void> {
  await ButtonZWaveHandler.configureDevice(device);
  await SwitchZWaveHandler.configureDevice(device, buttonCount);

  const settings: Record<string, string> = {};

  try {
    const switchTypeResponse = await device.getConfigurationBulk(1, buttonCount);
    const switchDetachedResponses = noDetachedSetting ? [] : await device.getConfigurationBulk(7, buttonCount);

    let anyInputReportsButtonPresses = false;
    let anyInputReportsSwitchChanges = false;

    for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
      const buttonDetachedMode = noDetachedSetting ? 1 : switchDetachedResponses[buttonIndex].readUInt8();
      const switchType = switchTypeResponse[buttonIndex].readUInt8();

      const detached = buttonDetachedMode === 1;
      const momentary = switchType === 0;

      settings[`zwaveSwitchTypeSW${buttonIndex + 1}`] = switchType.toFixed();
      settings[`zwaveSwitchDetachedModeSW${buttonIndex + 1}`] = buttonDetachedMode.toFixed();

      anyInputReportsButtonPresses ||= detached && momentary;
      anyInputReportsSwitchChanges ||= detached && !momentary;
    }

    const buttonFlow = buttonCount === 1 ? 'hidden.single_button_pressed' : 'hidden.button_pressed';
    if (anyInputReportsButtonPresses) {
      await safeAddCapability(device, buttonFlow);
    } else {
      await safeRemoveCapability(device, buttonFlow);
    }

    const switchFlow = buttonCount === 1 ? 'hidden.single_input_switch_changed' : 'hidden.input_switch_changed';
    if (anyInputReportsSwitchChanges) {
      await safeAddCapability(device, switchFlow);
    } else {
      await safeRemoveCapability(device, switchFlow);
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

    let anyInputReportsButtonPresses = false;
    let anyInputReportsSwitchChanges = false;

    for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
      const detached = noDetachedSetting ? true : newSettings[`zwaveSwitchDetachedModeSW${buttonIndex + 1}`] === '1';
      const momentary = newSettings[`zwaveSwitchTypeSW${buttonIndex + 1}`] === '0';

      anyInputReportsButtonPresses ||= detached && momentary;
      anyInputReportsSwitchChanges ||= detached && !momentary;
    }

    const buttonFlow = buttonCount === 1 ? 'hidden.single_button_pressed' : 'hidden.button_pressed';
    if (anyInputReportsButtonPresses) {
      await safeAddCapability(device, buttonFlow);
    } else {
      await safeRemoveCapability(device, buttonFlow);
    }

    const switchFlow = buttonCount === 1 ? 'hidden.single_input_switch_changed' : 'hidden.input_switch_changed';
    if (anyInputReportsSwitchChanges) {
      await safeAddCapability(device, switchFlow);
    } else {
      await safeRemoveCapability(device, switchFlow);
    }

    break;
  }
}

export function getButtonIndices(
  device: ShellyZWaveDevice,
  buttonCount: number,
  { noDetachedSetting = false } = {},
): number[] {
  const buttons = [];
  const settings = device.getSettings();

  for (let i = 0; i < buttonCount; i++) {
    const momentary = settings[`zwaveSwitchTypeSW${i + 1}`] !== '0';
    const detached = noDetachedSetting ? true : settings[`zwaveSwitchDetachedModeSW${i + 1}`] === '1';
    if (detached && momentary) {
      buttons.push(i);
    }
  }

  return buttons;
}

export function getSwitchIndices(
  device: ShellyZWaveDevice,
  buttonCount: number,
  { noDetachedSetting = false } = {},
): number[] {
  const switches = [];
  const settings = device.getSettings();

  for (let i = 0; i < buttonCount; i++) {
    const momentary = settings[`zwaveSwitchTypeSW${i + 1}`] !== '0';
    const detached = noDetachedSetting ? true : settings[`zwaveSwitchDetachedModeSW${i + 1}`] === '1';
    if (detached && !momentary) {
      switches.push(i);
    }
  }

  return switches;
}
