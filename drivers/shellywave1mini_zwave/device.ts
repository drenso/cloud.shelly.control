import type { FirmwareVersion } from '../../lib/zwave/ZWaveDevice.js';
import ShellyWave1ZWaveDevice from '../shellywave1_zwave/device.js';

export default class ShellyWave1MiniZWaveDevice extends ShellyWave1ZWaveDevice {
  public readonly minimumFirmwareVersion: FirmwareVersion = [14, 0];
}
