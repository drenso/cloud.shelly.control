import assert from 'node:assert/strict';
import { test } from 'node:test';
import Input, { type InputConfig, type InputHomeySettings } from '../lib/component/components/Input.js';
import type ShellyLocalDevice from '../lib/local/LocalDevice.js';
import type { VirtualDevice } from '../lib/VirtualDevice.js';

type Fixture = {
  input: Input;
  homeyDevice: ShellyLocalDevice;
  capabilities: Map<string, unknown>;
  flows: string[];
  initialize: () => Promise<void>;
  select: (value: string) => Promise<void>;
};

function fixture(
  id = 100,
  type: InputConfig['type'] = 'switch',
  sensorType = 'generic',
  state: boolean | null = true,
): Fixture {
  const capabilities = new Map<string, unknown>();
  const settings: Record<string, unknown> = { addonInputSensorType: sensorType };
  const flows: string[] = [];
  const input = new Input({} as VirtualDevice, { id, state }, { id, name: 'Pantry', type, enable: true }, undefined);
  const components = new Map([[`input:${id}`, input]]);
  const homeyDevice = {
    virtualDevice: { virtualComponents: components },
    getTypedStore: () => ({ components: [...components.keys()] }),
    getSetting: (key: string) => settings[key],
    hasCapability: (key: string) => capabilities.has(key),
    addCapability: async (key: string) => {
      capabilities.set(key, null);
    },
    removeCapability: async (key: string) => {
      capabilities.delete(key);
    },
    setCapabilityValue: async (key: string, value: unknown) => {
      capabilities.set(key, value);
    },
    setCapabilityOptions: async () => {},
    setComponentSettings: async () => {},
    updateErrors: async () => {},
    error: (error: unknown) => {
      throw error;
    },
    homey: {
      flow: {
        getDeviceTriggerCard: (id: string): { trigger: () => Promise<void> } => ({
          trigger: async (): Promise<void> => {
            flows.push(id);
          },
        }),
      },
    },
  } as unknown as ShellyLocalDevice;
  async function initialize(): Promise<void> {
    for (const capability of await input.registerHomeyDevice(homeyDevice, [])) capabilities.set(capability, null);
    await input.setInitialValues(homeyDevice);
  }
  async function select(value: string): Promise<void> {
    const event = {
      changedKeys: ['addonInputSensorType'],
      oldSettings: settings,
      newSettings: { addonInputSensorType: value },
    };
    await input.handleSettings(homeyDevice, event as SettingsEvent<InputHomeySettings>);
    settings.addonInputSensorType = value;
  }
  return { input, homeyDevice, capabilities, flows, initialize, select };
}

test('generic is the default and does not add a zone activity capability', async () => {
  const f = fixture();
  await f.initialize();
  assert.equal(f.capabilities.get('shelly_input_switch.100'), true);
  assert.equal(f.capabilities.has('alarm_motion.100'), false);
  assert.equal(f.capabilities.has('alarm_contact.100'), false);
});

test('motion uses the current state immediately and preserves input Flow cards', async () => {
  const f = fixture();
  await f.initialize();
  await f.select('motion');
  assert.equal(f.capabilities.get('alarm_motion.100'), true);
  await f.input.updateStatus(f.homeyDevice, { id: 100, state: false });
  assert.equal(f.capabilities.get('alarm_motion.100'), false);
  assert.equal(f.capabilities.get('shelly_input_switch.100'), false);
  assert(f.flows.includes('input_switch_changed'));
  await f.input.updateStatus(f.homeyDevice, { id: 100, state: null });
  assert.equal(f.capabilities.get('alarm_motion.100'), null);
});

test('changing role clears the old alarm and reverting restores the generic capabilities', async () => {
  const f = fixture(100, 'switch', 'motion');
  await f.initialize();
  await f.select('contact');
  assert.equal(f.capabilities.has('alarm_motion.100'), false);
  assert.equal(f.capabilities.get('alarm_contact.100'), true);
  await f.select('generic');
  assert.equal(f.capabilities.has('alarm_contact.100'), false);
  assert.equal(f.capabilities.get('shelly_input_switch.100'), true);
});

test('saved role is restored on initialization and remains through config updates', async () => {
  const f = fixture(101, 'switch', 'contact', false);
  await f.initialize();
  assert.equal(f.capabilities.get('alarm_contact.101'), false);
  await f.input.onConfigUpdate(f.homeyDevice, f.input.config);
  assert.equal(f.capabilities.get('alarm_contact.101'), false);
});

test('internal, virtual, button, analog and counter inputs never become motion sensors', async () => {
  for (const [id, type] of [
    [0, 'switch'],
    [200, 'switch'],
    [100, 'button'],
    [100, 'analog'],
    [100, 'count'],
  ] as const) {
    const f = fixture(id, type, 'motion');
    await f.initialize();
    await f.select('contact');
    assert.equal(
      [...f.capabilities.keys()].some(key => /^alarm_(motion|contact)/.test(key)),
      false,
    );
  }
});

test('changing an input out of switch mode removes its activity alarm', async () => {
  const f = fixture(100, 'switch', 'motion');
  await f.initialize();
  f.input.config.type = 'button';
  await f.input.onConfigUpdate(f.homeyDevice, f.input.config);
  assert.equal(f.capabilities.has('alarm_motion.100'), false);
});

test('a shared input keeps each Homey device role independent', async () => {
  const first = fixture(100, 'switch', 'motion');
  const second = fixture(100, 'switch', 'contact');
  await first.initialize();
  for (const capability of await first.input.registerHomeyDevice(second.homeyDevice, [])) {
    second.capabilities.set(capability, null);
  }
  await first.input.setInitialValues(second.homeyDevice);
  assert.equal(second.capabilities.get('alarm_contact.100'), true);
  await first.select('generic');
  await first.input.onStatusUpdate(second.homeyDevice, { state: false });
  assert.equal(first.capabilities.has('alarm_motion.100'), false);
  assert.equal(second.capabilities.get('alarm_contact.100'), false);
  assert.equal(second.capabilities.has('alarm_motion.100'), false);
});
