This repository is mirrored from our internal GitLab instance.

## Device interview

We offer a script to interview your LAN device. Download the .exe or linux executable from the releases page, and execute it as follows:

```
./interview-shelly-control-{os} <your_device_ip>
```

## Development

If you want to develop locally, make sure to remove both the `.nmprc` and `package-lock.json` files first before running `npm install` as otherwise you will not be able to install the dependencies correctly.

When submitting a PR always exclude the `.npmrc` and `package-lock.json` files.

## Add-on digital input sensors

On supported LAN drivers, the add-on device has an **Add-on digital inputs - Report as**
setting in its advanced settings. Select **Motion sensor** for a PIR or **Contact sensor**
for a door/window contact to expose a standard Homey alarm and contribute to Zone Activity
in the zone containing the add-on device. **Generic input** is the default.

The setting applies to all switch-type external inputs (IDs 100–199) on that add-on.
Each input has its own alarm capability. Existing switch input capabilities and Flow
cards remain available in every mode. Internal wall-switch inputs, button inputs,
analog inputs and counters are unaffected.

This is a Homey-only interpretation of the input state; it does not change the Shelly
configuration or any local scripts. Configure input inversion on the Shelly so that
`true` means motion detected or contact open. Changes take effect immediately, using
the current input state, and are restored when the app restarts. Returning to Generic
input removes the additional alarm.

To run the input sensor regression tests:

```
npx tsx --test tests/inputSensorTypes.test.ts
```
