import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.onrol.app",
  appName: "ONROL",
  webDir: "dist",
  android: {
    buildOptions: {
      keystorePath: "android/app/onrol-release.keystore",
      keystoreAlias: "onrol",
    },
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Geolocation: {
      // Declared in AndroidManifest.xml — plugin handles runtime prompts
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0A1628",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#00000000",
    },
    App: {
      // Deep-link: onrol://app/... handled in AppUrlOpen listener
    },
  },
  server: {
    // During development only — remove before `cap sync` for production build
    // url: "http://192.168.x.x:8080",
    cleartext: false,
  },
};

export default config;
