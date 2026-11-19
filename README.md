This repository is mirrored from our internal GitLab instance.

## Device interview

We offer a script to interview your LAN device. Download the .exe or linux executable from the releases page, and execute it as follows:

```
./interview-shelly-control-{os} <your_device_ip>
```

## Development

If you want to develop locally, make sure to remove both the `.nmprc` and `package-lock.json` files first before running `npm install` as otherwise you will not be able to install the dependencies correctly.

When submitting a PR always exclude the `.npmrc` and `package-lock.json` files.

### Driver images

Device images are shared in `assets/drivers/<model>/images`. Each driver's
`assets/images` directory links to its model's shared images so the mobile device
picker can load them from the standard driver asset path. Homey CLI follows these
links when building the app. When adding a driver, include this relative link as
well as the image paths in `driver.compose.json`.
