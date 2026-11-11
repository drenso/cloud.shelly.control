import type ShellyZWaveDevice from '../ZWaveDevice.js';
import { safeTriggerInputSwitchChanged, safeTriggerSingleInputSwitchChanged } from '../../flow/switchInputFlows.js';

export type SwitchBinaryReport = {
  'Current Value (Raw)': Buffer;
  'Current Value': string;
  'Target Value (Raw)': Buffer;
  'Target Value': string;
  'Duration (Raw)': Buffer;
  Duration: string | number;
  Value: string;
};

export async function configureDevice(device: ShellyZWaveDevice, buttonCount: number): Promise<void> {
  if (device.node.CommandClass['COMMAND_CLASS_SWITCH_BINARY'] !== undefined) {
    for (let i = 0; i < buttonCount; i++) {
      device.registerMultiChannelReportListener(
        2 + i,
        'SWITCH_BINARY',
        'SWITCH_BINARY_REPORT',
        (payload: SwitchBinaryReport) => {
          if (
            device.getSetting(`zwaveSwitchTypeSW${i + 1}`) === '0' ||
            // For the Wave Shutter
            device.getSetting('zwaveSwitchTypeSW1SW2') === '0'
          ) {
            // Ignore if in momentary mode, as inputs are then already reported as button presses
            return;
          }
          const targetValue = payload['Target Value (Raw)'].readUInt8();
          device.debug(i, payload['Target Value'], targetValue);
          if (device.hasCapability('hidden.single_input_switch_changed')) {
            safeTriggerSingleInputSwitchChanged(device, targetValue === 0xff);
          }
          if (device.hasCapability('hidden.input_switch_changed')) {
            safeTriggerInputSwitchChanged(device, i, targetValue === 0xff);
          }
        },
      );
    }
  }
}
