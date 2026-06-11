import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.zeyawang.gujing',
  appName: '股镜',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'gujing',
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
