import { type AllowedPrimitives, ComponentWithId } from '../Component.js';
import SetConfig from './Cury/SetConfig.js';
import GetConfig from './Cury/GetConfig.js';
import GetStatus from './Cury/GetStatus.js';
import type ShellyLocalDevice from '../../local/LocalDevice.js';
import type { ComponentMethod } from './Shelly/ListMethods.js';
import type { RpcChannel } from '../../rpc/channel/RpcChannel.js';
import GetVialInfo, { type CuryGetVialInfoParams, type CuryGetVialInfoResponse } from './Cury/GetVialInfo.js';
import Set, { type CurySetParams } from './Cury/Set.js';
import type { ResponseSuccessFrame } from '../../rpc/Rpc.js';
import Boost, { type CuryBoostParams, type CuryBoostResponse } from './Cury/Boost.js';
import StopBoost, { type CuryStopBoostParams, type CuryStopBoostResponse } from './Cury/StopBoost.js';
import SetMode, { type CurySetModeParams } from './Cury/SetMode.js';
import SetAwayMode, { type CurySetAwayModeParams } from './Cury/SetAwayMode.js';
import capabilitiesOptions from './Cury/capabilitiesOptions.json' with { type: 'json' };
import type { RecursivePartial } from '../../util.js';
import type { RpcError } from '../../rpc/RpcError.js';
import { safeTriggerDeviceCard } from '../../safeFunctions.js';

export type CuryConfig = {
  /** Identifier of the component instance */
  id: number;
  /** Name of the component instance */
  name: string | null;
  /** Time in seconds that boost will be active after turned on */
  boost_time: number;
  /** Automatically turn on heating for other vial if current one has become empty */
  auto_heating_on: boolean;
  /** Object to configure LEDs for left and right slot */
  ui: {
    /**
     * Information to show on inactive (no user interaction) state.
     *
     * - `off`: Turn off slot LEDs
     * - `level`: Show vial liquid level
     * - `intensity`: Show vial vaporization intensity
     */
    mode: 'off' | 'level' | 'intensity';
    /** UI brightness in inactive mode */
    brightness: number;
  };
  /** Controls ambient light behavior */
  ambient: {
    /** Should ambient light be enabled or not */
    enable: boolean;
    /** Should ambient light use the color from the active vial/slot, if color data is present in the vial */
    use_vial_color: boolean;
    /**
     * Color to use when ambient is on but the vial slots are inactive,
     * empty or no vial has color info data in it's nfc tag.
     *
     * Red, Green, Blue [r,g,b] - each value represents level between 0..255
     */
    color: [number, number, number];
    /**
     * Ambient color brightness if no vial is active/present or neither vial has color data.
     *
     * Range in 0-100 in percents
     */
    brightness: number;
  };
  /**
   * Default power on states for slots.
   *
   * Boosts do not survive power cycling
   */
  initial_state: {
    left: InitialState;
    right: InitialState;
  };
  /** Slot timer configuration */
  timer: {
    left: TimerConfig;
    right: TimerConfig;
  };
};

type InitialState = 'restore_last' | 'on' | 'off';

type TimerConfig = {
  /** True if the "Automatic ON" function is enabled, false otherwise */
  auto_on: boolean;
  /** Seconds to pass until the slot vial heating is set back to on */
  auto_on_delay: number;
  /** True if the "Automatic OFF" function is enabled, false otherwise */
  auto_off: boolean;
  /** Seconds to pass until the slot vial heating is set back to off */
  auto_off_delay: number;
};

export type CuryStatus = {
  /** Identifier of the component instance */
  id: number;
  /** Currently set mode of operation or null if none is activated */
  mode: 'bedroom' | 'living_room' | 'lavatory_room' | 'reception' | 'hall' | 'workplace' | null;
  /** Away mode active */
  away_mode: boolean;
  slots: {
    /** Status of left slot or null if no vial is present */
    left: SlotStatus | null;
    /** Status of right slot or null if no vial is present */
    right: SlotStatus | null;
  };
  /** Device errors if present */
  errors?: (
    | 'nfc_bus'
    | 'acc_bus'
    | 'keyboard_button_stuck'
    | 'keyboard_general_error'
    | 'input_voltage_out_of_range'
    | 'thermal_sensor_connection'
    | 'thermal_sensor_driver'
    | 'heater_disconnected'
    | 'heater_overload'
    | 'input_voltage_change'
    | 'orientation_tilt'
    | 'orientation_plug_rotated'
  )[];
};

export type SlotStatus = {
  /** Current intensity in percent 0..100 */
  intensity: number;
  /** Vial heating enabled */
  on: boolean;
  boost: {
    /** Unix timestamp of moment boost was activated */
    started_at: number;
    /** Boost duration in seconds */
    duration: number;
  } | null;
  timer: {
    /** Unix timestamp of moment the timer was started */
    timer_started_at: number;
    /** Timer duration in seconds */
    timer_duration: number;
  } | null;
  vial: {
    /**
     * Current liquid level in percent 0-100
     *
     * -1 if liquid level is still being retrieved
     */
    level: number;
    /** Serial number of vial */
    serial: string;
    /** Vial Aroma name */
    name: string;
    /** Vial error (present only when error is detected) */
    vial_fault?: 'non_genuine' | 'tag_error' | 'expired' | 'empty';
  };
};

export type CuryHomeySettings = {
  'Cury:boost_time': number;
  'Cury:auto_heating_on': boolean;
  'Cury:ui.mode': 'off' | 'level' | 'intensity';
  'Cury:ui.brightness': number;
  'Cury:ambient.enable': boolean;
  'Cury:ambient.use_vial_color': boolean;
  'Cury:ambient.color.r': number;
  'Cury:ambient.color.g': number;
  'Cury:ambient.color.b': number;
  'Cury:ambient.brightness': number;
  'Cury:initial_state.left': 'restore_last' | 'on' | 'off';
  'Cury:initial_state.right': 'restore_last' | 'on' | 'off';
};

export default class Cury extends ComponentWithId<'Cury', CuryStatus, CuryConfig, CuryHomeySettings> {
  protected readonly _SetConfig = SetConfig;
  protected readonly _GetConfig = GetConfig;
  protected readonly _GetStatus = GetStatus;
  public readonly namespace = 'Cury';
  public static readonly uiName = 'Cury';
  public static readonly key = 'cury';

  public async GetVialInfo<Slot extends 'left' | 'right' | undefined>(
    channel: RpcChannel,
    params?: CuryGetVialInfoParams<Slot>,
  ): Promise<ResponseSuccessFrame<CuryGetVialInfoResponse<Slot> | null>> {
    return GetVialInfo<Slot>(channel, this.id, params);
  }

  public async Set(channel: RpcChannel, params: CurySetParams): Promise<ResponseSuccessFrame<null>> {
    return Set(channel, this.id, params);
  }

  public async Boost(channel: RpcChannel, params: CuryBoostParams): Promise<ResponseSuccessFrame<CuryBoostResponse>> {
    return Boost(channel, this.id, params);
  }

  public async StopBoost(
    channel: RpcChannel,
    params: CuryStopBoostParams,
  ): Promise<ResponseSuccessFrame<CuryStopBoostResponse>> {
    return StopBoost(channel, this.id, params);
  }

  public async SetMode(channel: RpcChannel, params: CurySetModeParams): Promise<ResponseSuccessFrame<null>> {
    return SetMode(channel, this.id, params);
  }

  public async SetAwayMode(channel: RpcChannel, params: CurySetAwayModeParams): Promise<ResponseSuccessFrame<null>> {
    return SetAwayMode(channel, this.id, params);
  }

  public async registerHomeyDevice(
    homeyDevice: ShellyLocalDevice,
    _methods: ComponentMethod<'Cury'>[],
  ): Promise<string[]> {
    const componentCapabilities: string[] = [];

    for (const slot of ['left', 'right'] as const) {
      componentCapabilities.push(
        await this.registerCapability(
          homeyDevice,
          `shelly_diffuser_intensity.${slot}`,
          capabilitiesOptions[`shelly_diffuser_intensity.${slot}`],
          async value => {
            await this.Set(this.device.getChannel(), {
              slot: slot,
              intensity: value * 100,
            }).catch((err: RpcError) => {
              if (err.code === -109) {
                throw new Error(homeyDevice.homey.__('component.Cury.no_vial'));
              }
              throw err;
            });
          },
        ),
      );
    }

    for (const slot of ['left', 'right'] as const) {
      componentCapabilities.push(
        await this.registerCapability(
          homeyDevice,
          `shelly_diffuser_active.${slot}`,
          capabilitiesOptions[`shelly_diffuser_active.${slot}`],
          async value => {
            await this.Set(this.device.getChannel(), {
              slot: slot,
              on: value,
            }).catch((err: RpcError) => {
              if (err.code === -109) {
                throw new Error(homeyDevice.homey.__('component.Cury.no_vial'));
              }
              throw err;
            });
          },
        ),
      );
    }

    for (const slot of ['left', 'right'] as const) {
      componentCapabilities.push(
        await this.registerCapability(
          homeyDevice,
          `shelly_diffuser_boost.${slot}`,
          capabilitiesOptions[`shelly_diffuser_boost.${slot}`],
          async value => {
            const method = value ? this.Boost : this.StopBoost;
            await method
              .bind(this)(this.device.getChannel(), { slot: slot })
              .catch((err: RpcError) => {
                if (err.code === -101) {
                  throw new Error(homeyDevice.homey.__('component.Cury.no_vial'));
                }
                throw err;
              });
          },
        ),
      );
    }

    for (const capability of [
      `shelly_diffuser_vial_level`,
      'shelly_diffuser_vial_fragrance',
      'shelly_diffuser_vial_expiration',
    ] as const) {
      for (const slot of ['left', 'right'] as const) {
        componentCapabilities.push(
          await this.registerCapability(
            homeyDevice,
            `${capability}.${slot}`,
            capabilitiesOptions[`${capability}.${slot}`],
          ),
        );
      }
    }

    componentCapabilities.push('alarm_generic', 'shelly_errors');

    return componentCapabilities;
  }

  public async onStatusUpdate(
    homeyDevice: ShellyLocalDevice,
    status: RecursivePartial<CuryStatus, AllowedPrimitives>,
  ): Promise<void> {
    for (const slot of ['left', 'right'] as const) {
      const slotStatus = status.slots?.[slot];
      if (!slotStatus) {
        await this.setCapability(homeyDevice, `shelly_diffuser_vial_level.${slot}`, null);
        await this.setCapability(homeyDevice, `shelly_diffuser_vial_fragrance.${slot}`, null);
        await this.setCapability(homeyDevice, `shelly_diffuser_vial_expiration.${slot}`, null);
        await this.setCapability(homeyDevice, `shelly_diffuser_intensity.${slot}`, null);
        await this.setCapability(homeyDevice, `shelly_diffuser_active.${slot}`, false);
        await this.setCapability(homeyDevice, `shelly_diffuser_boost.${slot}`, false);
        await homeyDevice.unsetStoreValue(`shelly_curry_${slot}_serial`);
        continue;
      }

      if (slotStatus.intensity !== undefined) {
        const newIntensity = slotStatus.intensity / 100;
        if (this.getCapability(homeyDevice, `shelly_diffuser_intensity.${slot}`) !== newIntensity) {
          await safeTriggerDeviceCard(
            homeyDevice,
            'cury_intensity_changed',
            { intensity: slotStatus.intensity },
            { slot },
          );
        }
        await this.setCapability(homeyDevice, `shelly_diffuser_intensity.${slot}`, slotStatus.intensity / 100);
      }

      if (slotStatus.on !== undefined) {
        if (this.getCapability(homeyDevice, `shelly_diffuser_active.${slot}`) !== slotStatus.on) {
          await safeTriggerDeviceCard(homeyDevice, 'cury_active_changed', undefined, {
            slot,
            state: slotStatus.on,
          });
        }
        await this.setCapability(homeyDevice, `shelly_diffuser_active.${slot}`, slotStatus.on);
      }

      if (slotStatus.boost !== undefined) {
        const boosting = slotStatus.boost !== null;
        if (this.getCapability(homeyDevice, `shelly_diffuser_boost.${slot}`) !== boosting) {
          await safeTriggerDeviceCard(homeyDevice, 'cury_boost_changed', undefined, {
            slot,
            state: boosting,
          });
        }
        await this.setCapability(homeyDevice, `shelly_diffuser_boost.${slot}`, boosting);
      }

      const vial = slotStatus.vial;

      if (vial !== undefined) {
        const level = vial.level === -1 ? null : vial.level;

        if (level !== null && this.getCapability(homeyDevice, `shelly_diffuser_vial_level.${slot}`) !== level) {
          await safeTriggerDeviceCard(homeyDevice, 'cury_vial_level_changed', { level }, { slot });
        }

        await this.setCapability(homeyDevice, `shelly_diffuser_vial_level.${slot}`, level);

        await this.setCapability(homeyDevice, `shelly_diffuser_vial_fragrance.${slot}`, vial.name);

        if (homeyDevice.getStoreValue(`shelly_curry_${slot}_serial`) !== vial.serial) {
          const vialInfoResponse = await this.GetVialInfo(this.device.getChannel(), { slot });

          const slotInfo = vialInfoResponse.result;

          const value = slotInfo?.exp_date ?? null;
          await this.setCapability(homeyDevice, `shelly_diffuser_vial_expiration.${slot}`, value);

          await homeyDevice
            .setStoreValue(`shelly_curry_${slot}_serial`, slotInfo?.serial)
            .catch(err => homeyDevice.error(`Error while setting shelly_curry_${slot}_serial:`, err));
        }
      }
    }

    const errors: string[] = this.status.errors ?? [];

    const leftVialFault = this.status.slots.left?.vial.vial_fault;

    if (leftVialFault !== undefined) {
      errors.push(leftVialFault);
    }

    const rightVialFault = this.status.slots.right?.vial.vial_fault;

    if (rightVialFault !== undefined) {
      errors.push(rightVialFault);
    }

    await homeyDevice.updateErrors(this.getComponentKey(), errors);
  }

  public async onConfigUpdate(_homeyDevice: ShellyLocalDevice, _config: CuryConfig): Promise<void> {}
}
