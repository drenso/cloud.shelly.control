import type { FirmwareVersion } from '../../lib/zwave/ZWaveDevice.js';
import ShellyWave1PMZWaveDevice from '../shellywave1pm_zwave/device.js';

export default class ShellyWave1PMMiniZWaveDevice extends ShellyWave1PMZWaveDevice {
  public readonly minimumFirmwareVersion: FirmwareVersion = [14, 3];
}
