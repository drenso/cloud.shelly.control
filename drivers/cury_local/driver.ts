import ShellyLocalDriver from '../../lib/local/LocalDriver.js';
import type ShellyLocalDevice from '../../lib/local/LocalDevice.js';

export default class ShellyCuryLocalDriver extends ShellyLocalDriver {
  public async onInit(): Promise<void> {
    await super.onInit();

    this.homey.flow
      .getActionCard('cury_set_active')
      .registerRunListener((cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right'; state: boolean }) =>
        cardArgs.device.triggerCapabilityListener(`shelly_diffuser_active.${cardArgs.slot}`, cardArgs.state),
      );

    this.homey.flow
      .getActionCard('cury_set_intensity')
      .registerRunListener((cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right'; intensity: number }) =>
        cardArgs.device.triggerCapabilityListener(`shelly_diffuser_intensity.${cardArgs.slot}`, cardArgs.intensity),
      );

    this.homey.flow
      .getActionCard('cury_set_boost')
      .registerRunListener((cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right'; state: boolean }) =>
        cardArgs.device.triggerCapabilityListener(`shelly_diffuser_boost.${cardArgs.slot}`, cardArgs.state),
      );

    this.homey.flow
      .getDeviceTriggerCard('cury_active_changed')
      .registerRunListener(
        (
          cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right'; state: boolean },
          triggerArgs: { slot: 'left' | 'right'; state: boolean },
        ) => {
          return cardArgs.slot === triggerArgs.slot && cardArgs.state === triggerArgs.state;
        },
      );

    this.homey.flow
      .getDeviceTriggerCard('cury_intensity_changed')
      .registerRunListener(
        (cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right' }, triggerArgs: { slot: 'left' | 'right' }) => {
          return cardArgs.slot === triggerArgs.slot;
        },
      );

    this.homey.flow
      .getDeviceTriggerCard('cury_boost_changed')
      .registerRunListener(
        (
          cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right'; state: boolean },
          triggerArgs: { slot: 'left' | 'right'; state: boolean },
        ) => {
          return cardArgs.slot === triggerArgs.slot && cardArgs.state === triggerArgs.state;
        },
      );

    this.homey.flow
      .getDeviceTriggerCard('cury_vial_level_changed')
      .registerRunListener(
        (cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right' }, triggerArgs: { slot: 'left' | 'right' }) => {
          return cardArgs.slot === triggerArgs.slot;
        },
      );

    this.homey.flow
      .getConditionCard('cury_is_active')
      .registerRunListener((cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right' }) =>
        cardArgs.device.getCapabilityValue(`shelly_diffuser_active.${cardArgs.slot}`),
      );

    this.homey.flow
      .getConditionCard('cury_is_boosting')
      .registerRunListener((cardArgs: { device: ShellyLocalDevice; slot: 'left' | 'right' }) =>
        cardArgs.device.getCapabilityValue(`shelly_diffuser_boost.${cardArgs.slot}`),
      );
  }
}
