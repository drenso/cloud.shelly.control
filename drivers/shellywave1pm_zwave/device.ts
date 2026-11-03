import * as SingleButtonZWaveHandler from '../../lib/zwave/handlers/SingleButtonZWaveHandler.js';
import ShellyZWaveDevice from '../../lib/zwave/ZWaveDevice.js';
import type { ButtonEventType } from '../../lib/flow/buttonFlows.js';

export default class ShellyWave1PMZWaveDevice extends ShellyZWaveDevice {
  public readonly minimumFirmwareVersion = [14, 1] as const;

  protected async configureDevice(): Promise<void> {
    await SingleButtonZWaveHandler.configureDevice(this);
    this.registerCapability('onoff', 'SWITCH_BINARY');
    this.registerCapability('alarm_heat', 'NOTIFICATION');
    this.registerReportListener('NOTIFICATION', 'NOTIFICATION_REPORT', report => {
      if (report?.['Notification Type'] === 'Power Management') {
        let value = null;

        if (report['Event (Parsed)'] === 'Over-current detected') {
          value = true;
        }

        if (report['Event (Parsed)'] === 'Event inactive') {
          value = false;
        }

        this.setCapabilityValue('alarm_shelly_overcurrent', value).catch(err =>
          this.error(`Error while setting alarm_shelly_overcurrent to ${value}:`, err),
        );
      }
    });
    this.registerReportListener('NOTIFICATION', 'NOTIFICATION_REPORT', report => {
      if (report?.['Notification Type'] === 'Power Management') {
        let value = null;

        if (report['Event (Parsed)'] === 'Over-voltage detected') {
          value = true;
        }

        if (report['Event (Parsed)'] === 'Event inactive') {
          value = false;
        }

        this.setCapabilityValue('alarm_shelly_overvoltage', value).catch(err =>
          this.error(`Error while setting alarm_shelly_overvoltage to ${value}:`, err),
        );
      }
    });
  }

  public async onSettings(
    event: SettingsEvent<Record<string, boolean | string | number | undefined | null>>,
  ): Promise<string | void> {
    await SingleButtonZWaveHandler.onSettings(this, event);
    await super.onSettings(event);
  }

  public getButtonEventTypes(): ButtonEventType[] {
    return ['single_press', 'double_press', 'long_press', 'hold'];
  }
}
