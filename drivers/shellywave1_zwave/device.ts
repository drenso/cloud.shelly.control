import * as InputZWaveHandler from '../../lib/zwave/handlers/InputZWaveHandler.js';
import ShellyZWaveDevice, { type FirmwareVersion } from '../../lib/zwave/ZWaveDevice.js';
import type { ButtonEventType } from '../../lib/flow/buttonFlows.js';

export default class ShellyWave1ZWaveDevice extends ShellyZWaveDevice {
  public readonly minimumFirmwareVersion: FirmwareVersion = [14, 0];

  protected async configureDevice(): Promise<void> {
    await InputZWaveHandler.configureDevice(this, 1);
    this.registerCapability('onoff', 'SWITCH_BINARY');
    this.registerCapability('alarm_heat', 'NOTIFICATION');
  }

  public async onSettings(
    event: SettingsEvent<Record<string, boolean | string | number | undefined | null>>,
  ): Promise<string | void> {
    await InputZWaveHandler.onSettings(this, event, 1);
    await super.onSettings(event);
  }

  public getButtonEventTypes(): ButtonEventType[] {
    return ['single_press', 'double_press', 'long_press', 'hold'];
  }
}
