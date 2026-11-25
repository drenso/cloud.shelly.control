import * as InputZWaveHandler from '../../lib/zwave/handlers/InputZWaveHandler.js';
import ShellyZWaveDevice, { type FirmwareVersion } from '../../lib/zwave/ZWaveDevice.js';
import type { ButtonEventType } from '../../lib/flow/buttonFlows.js';
import type {
  ButtonEventTypesDeviceInterface,
  ButtonIndicesDeviceInterface,
  SwitchIndicesDeviceInterface,
} from '../../lib/capabilityInterfaces.js';

export default class ShellyWave2PMZWaveDevice
  extends ShellyZWaveDevice
  implements ButtonEventTypesDeviceInterface, ButtonIndicesDeviceInterface, SwitchIndicesDeviceInterface
{
  public readonly minimumFirmwareVersion: FirmwareVersion = [16, 5];

  protected async configureDevice(): Promise<void> {
    if (!this.node.isMultiChannelNode) {
      await InputZWaveHandler.configureDevice(this, 2, { switchEndpointOffset: 1 });
      return;
    }

    this.registerCapability('onoff', 'SWITCH_BINARY');
    this.registerCapability('measure_power', 'METER');
    this.registerCapability('meter_power', 'METER');

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
  }

  public async onSettings(
    event: SettingsEvent<Record<string, boolean | string | number | undefined | null>>,
  ): Promise<string | void> {
    await InputZWaveHandler.onSettings(this, event, 2);
    await super.onSettings(event);
  }

  public getButtonEventTypes(): ButtonEventType[] {
    return ['single_press', 'double_press', 'long_press', 'hold'];
  }

  public getButtonIndices(): number[] {
    return InputZWaveHandler.getButtonIndices(this, 2);
  }

  public getSwitchIndices(): number[] {
    return InputZWaveHandler.getSwitchIndices(this, 2);
  }
}
