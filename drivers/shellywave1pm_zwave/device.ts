import * as InputZWaveHandler from '../../lib/zwave/handlers/InputZWaveHandler.js';
import * as OverVoltageZWaveHandler from '../../lib/zwave/handlers/OverVoltageZWaveHandler.js';
import * as OverCurrentZWaveHandler from '../../lib/zwave/handlers/OverCurrentZWaveHandler.js';
import ShellyZWaveDevice, { type FirmwareVersion } from '../../lib/zwave/ZWaveDevice.js';
import type { ButtonEventType } from '../../lib/flow/buttonFlows.js';

export default class ShellyWave1PMZWaveDevice extends ShellyZWaveDevice {
  public readonly minimumFirmwareVersion: FirmwareVersion = [14, 1];

  protected async configureDevice(): Promise<void> {
    await InputZWaveHandler.configureDevice(this, 1);
    this.registerCapability('onoff', 'SWITCH_BINARY');
    this.registerCapability('measure_power', 'METER');
    this.registerCapability('meter_power', 'METER');
    this.registerCapability('alarm_heat', 'NOTIFICATION');
    await OverCurrentZWaveHandler.configureDevice(this);
    await OverVoltageZWaveHandler.configureDevice(this);
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
