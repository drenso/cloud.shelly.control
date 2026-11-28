import type ShellyZWaveDevice from '../ZWaveDevice.js';

export async function configureDevice(device: ShellyZWaveDevice): Promise<void> {
  device.registerCapability('alarm_shelly_overvoltage', 'NOTIFICATION', {
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
