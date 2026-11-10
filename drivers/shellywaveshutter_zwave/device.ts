import ShellyZWaveDevice from '../../lib/zwave/ZWaveDevice.js';
import { safeAddCapability, safeRemoveCapability } from '../../lib/safeFunctions.js';
import type { ButtonIndicesDeviceInterface, ButtonEventTypesDeviceInterface } from '../../lib/capabilityInterfaces.js';
import type { ButtonEventType } from '../../lib/flow/buttonFlows.js';
import * as ButtonZWaveHandler from '../../lib/zwave/handlers/ButtonZWaveHandler.js';

export default class ShellyWaveShutterZWaveDevice
  extends ShellyZWaveDevice
  implements ButtonIndicesDeviceInterface, ButtonEventTypesDeviceInterface
{
  public readonly minimumFirmwareVersion = [14, 2] as const;

  protected async configureDevice(): Promise<void> {
    const buttonCount = 2;

    await ButtonZWaveHandler.configureDevice(this);

    const settings: Record<string, string> = {};

    try {
      const switchTypeResponse = await this.getConfigurationBulk(5, 1);
      const switchDetachedResponses = await this.getConfigurationBulk(7, 2);

      const switchType = switchTypeResponse[0].readUInt8();
      settings['zwaveSwitchTypeSW1SW2'] = switchType.toFixed();
      const momentary = switchType === 0;

      let anyButtonDetached = false;

      for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
        const buttonDetached = switchDetachedResponses[buttonIndex].readUInt8() === 1;
        settings[`zwaveSwitchDetachedModeSW${buttonIndex + 1}`] = buttonDetached ? '1' : '0';
        anyButtonDetached ||= buttonDetached;
      }

      if (anyButtonDetached && momentary) {
        await safeAddCapability(this, 'hidden.button_pressed');
      } else {
        await safeRemoveCapability(this, 'hidden.button_pressed');
      }

      await this.setSettings(settings);
    } catch (err) {
      this.error('Error while getting initial setting values:', err);
    }

    this.registerCapability('measure_power', 'METER', { multiChannelNodeId: 1 });
    this.registerCapability('meter_power', 'METER', { multiChannelNodeId: 1 });
    this.registerCapability('windowcoverings_set', 'SWITCH_MULTILEVEL', { multiChannelNodeId: 1 });
    this.registerCapability('windowcoverings_tilt_set', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 2,
      getOpts: {
        getOnStart: false,
      },
    });
    if (this.hasCapability('windowcoverings_tilt_set')) {
      await this._getCapabilityValue('windowcoverings_tilt_set', 'SWITCH_MULTILEVEL').catch(err =>
        this.error('Error while getting initial windowcoverings_tilt_set value:', err),
      );
    }
    this.registerCapabilityListener('button.calibration', async () => this.startCalibration());
  }

  public async onSettings(event: {
    oldSettings: { [p: string]: boolean | string | number | undefined | null };
    newSettings: { [p: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    const buttonCount = 2;

    const { newSettings, changedKeys } = event;

    if (changedKeys.includes('zwaveShutterOperatingMode')) {
      // Check for venetian mode
      if (newSettings['zwaveShutterOperatingMode'] === '1') {
        await safeAddCapability(this, 'windowcoverings_tilt_set');
      } else {
        await safeRemoveCapability(this, 'windowcoverings_tilt_set');
      }
    }

    if (
      changedKeys.includes('zwaveSwitchTypeSW1SW2') ||
      changedKeys.includes('zwaveSwitchDetachedModeSW1') ||
      changedKeys.includes('zwaveSwitchDetachedModeSW2')
    ) {
      const momentary = newSettings['zwaveSwitchTypeSW1SW2'] === '0';

      let anyButtonDetached = false;

      for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
        const buttonDetached = newSettings[`zwaveSwitchDetachedModeSW${buttonIndex + 1}`] === '1';
        anyButtonDetached ||= buttonDetached;
      }

      if (anyButtonDetached && momentary) {
        await safeAddCapability(this, 'hidden.button_pressed');
      } else {
        await safeRemoveCapability(this, 'hidden.button_pressed');
      }
    }

    await super.onSettings(event);
  }

  public getButtonEventTypes(): ButtonEventType[] {
    return ['single_press', 'long_press', 'hold'];
  }

  public getButtonIndices(): number[] {
    const buttons = [];
    const settings = this.getSettings();
    if (settings['zwaveSwitchDetachedModeSW1'] === '1') {
      buttons.push(0);
    }
    if (settings['zwaveSwitchDetachedModeSW2'] === '1') {
      buttons.push(1);
    }
    return buttons;
  }
}
