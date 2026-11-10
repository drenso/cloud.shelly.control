import * as MultiButtonZWaveHandler from '../../lib/zwave/handlers/MultiButtonZWaveHandler.js';
import ShellyZWaveDevice from '../../lib/zwave/ZWaveDevice.js';
import type { ButtonEventType } from '../../lib/flow/buttonFlows.js';
import type { ButtonEventTypesDeviceInterface, ButtonIndicesDeviceInterface } from '../../lib/capabilityInterfaces.js';

export default class ShellyWaveI4DCZWaveDevice
  extends ShellyZWaveDevice
  implements ButtonIndicesDeviceInterface, ButtonEventTypesDeviceInterface
{
  public readonly minimumFirmwareVersion = [13, 0] as const;

  protected async configureDevice(): Promise<void> {
    await MultiButtonZWaveHandler.configureDevice(this, 4, { noDetachedSetting: true });
    this.registerCapability('alarm_heat', 'NOTIFICATION');
  }

  public async onSettings(
    event: SettingsEvent<Record<string, boolean | string | number | undefined | null>>,
  ): Promise<string | void> {
    await MultiButtonZWaveHandler.onSettings(this, event, 4, { noDetachedSetting: true });
    await super.onSettings(event);
  }

  public getButtonEventTypes(): ButtonEventType[] {
    return ['single_press', 'double_press', 'long_press', 'hold'];
  }

  public getButtonIndices(): number[] {
    const buttons = [];
    const settings = this.getSettings();

    for (let i = 0; i < 4; i++) {
      if (settings[`zwaveSwitchTypeSW${i + 1}`] === '0') {
        buttons.push(i);
      }
    }

    return buttons;
  }
}
