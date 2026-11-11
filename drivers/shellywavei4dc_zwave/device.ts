import * as InputZWaveHandler from '../../lib/zwave/handlers/InputZWaveHandler.js';
import ShellyZWaveDevice from '../../lib/zwave/ZWaveDevice.js';
import type { ButtonEventType } from '../../lib/flow/buttonFlows.js';
import type {
  ButtonEventTypesDeviceInterface,
  ButtonIndicesDeviceInterface,
  SwitchIndicesDeviceInterface,
} from '../../lib/capabilityInterfaces.js';

export default class ShellyWaveI4DCZWaveDevice
  extends ShellyZWaveDevice
  implements ButtonIndicesDeviceInterface, ButtonEventTypesDeviceInterface, SwitchIndicesDeviceInterface
{
  public readonly minimumFirmwareVersion = [13, 0] as const;

  protected async configureDevice(): Promise<void> {
    await InputZWaveHandler.configureDevice(this, 4, { noDetachedSetting: true });
    this.registerCapability('alarm_heat', 'NOTIFICATION');
  }

  public async onSettings(
    event: SettingsEvent<Record<string, boolean | string | number | undefined | null>>,
  ): Promise<string | void> {
    await InputZWaveHandler.onSettings(this, event, 4, { noDetachedSetting: true });
    await super.onSettings(event);
  }

  public getButtonEventTypes(): ButtonEventType[] {
    return ['single_press', 'double_press', 'long_press', 'hold'];
  }

  public getButtonIndices(): number[] {
    return InputZWaveHandler.getButtonIndices(this, 4, { noDetachedSetting: true });
  }

  public getSwitchIndices(): number[] {
    return InputZWaveHandler.getSwitchIndices(this, 4, { noDetachedSetting: true });
  }
}
