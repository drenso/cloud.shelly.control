import * as OverVoltageZWaveHandler from '../../lib/zwave/handlers/OverVoltageZWaveHandler.js';
import * as OverCurrentZWaveHandler from '../../lib/zwave/handlers/OverCurrentZWaveHandler.js';
import ShellyZWaveDevice, { type FirmwareVersion } from '../../lib/zwave/ZWaveDevice.js';

export default class ShellyWavePMMiniZWaveDevice extends ShellyZWaveDevice {
  public readonly minimumFirmwareVersion: FirmwareVersion = [13, 1];

  protected async configureDevice(): Promise<void> {
    this.registerCapability('measure_power', 'METER');
    this.registerCapability('meter_power', 'METER');
    this.registerCapability('alarm_heat', 'NOTIFICATION');
    await OverCurrentZWaveHandler.configureDevice(this);
    await OverVoltageZWaveHandler.configureDevice(this);
  }
}
