import * as InputZWaveHandler from '../../lib/zwave/handlers/InputZWaveHandler.js';
import ShellyZWaveDevice, { type FirmwareVersion } from '../../lib/zwave/ZWaveDevice.js';
import type { ButtonEventType } from '../../lib/flow/buttonFlows.js';

export default class ShellyWave1PMZWaveDevice extends ShellyZWaveDevice {
  public readonly minimumFirmwareVersion: FirmwareVersion = [14, 1];

  protected async configureDevice(): Promise<void> {
    await InputZWaveHandler.configureDevice(this, 1);
    this.registerCapability('onoff', 'SWITCH_BINARY');
    this.registerCapability('alarm_heat', 'NOTIFICATION');
    this.registerCapability('alarm_shelly_overcurrent', 'NOTIFICATION', {
      get: 'NOTIFICATION_GET',
      getParser: () => ({
        'V1 Alarm Type': 0,
        'Notification Type': 'Power Management',
        Event: 6,
      }),
      report: 'NOTIFICATION_REPORT',
      reportParser: (report: NotificationReport) => {
        if (!report) {
          return false;
        }
        if (report['Notification Type'] !== 'Power Management') {
          return false;
        }
        return report['Event (Parsed)'] === 'Over-current detected';
      },
    });
    this.registerCapability('alarm_shelly_overvoltage', 'NOTIFICATION', {
      get: 'NOTIFICATION_GET',
      getParser: () => ({
        'V1 Alarm Type': 0,
        'Notification Type': 'Power Management',
        Event: 7,
      }),
      report: 'NOTIFICATION_REPORT',
      reportParser: (report: NotificationReport) => {
        if (!report) {
          return false;
        }
        if (report['Notification Type'] !== 'Power Management') {
          return false;
        }
        return report['Event (Parsed)'] === 'Over-voltage detected';
      },
    });
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
