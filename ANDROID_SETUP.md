# ONROL Android Build Setup

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| JDK | 17 | https://adoptium.net (Eclipse Temurin 17 LTS) |
| Android SDK CLI | latest | https://developer.android.com/studio#command-tools |
| Node | ≥18 | already installed |

### Install Android SDK command-line tools (no Android Studio needed)

1. Download "Command line tools only" from https://developer.android.com/studio#command-tools
2. Extract to `C:\Android\cmdline-tools\latest\`
3. Add to System PATH:
   ```
   C:\Android\cmdline-tools\latest\bin
   C:\Android\platform-tools
   ```
4. Run:
   ```
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   sdkmanager --licenses
   ```
5. Set environment variable: `ANDROID_HOME=C:\Android`

---

## First-time Android setup

```bash
# 1. Add Android platform (run once)
npx cap add android

# 2. Build web assets + sync to Android project
npm run android:build

# 3. Open in Android Studio (optional, for debugging)
npm run android:open
```

---

## AndroidManifest.xml — add these permissions

After `cap add android`, edit `android/app/src/main/AndroidManifest.xml`.
Add inside `<manifest>` (before `<application>`):

```xml
<!-- Location (for visit check-in GPS) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Camera (for photo capture) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Push notifications (FCM) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

Add inside `<application>`:
```xml
<!-- Deep linking: onrol://app/... -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="onrol" android:host="app" />
</intent-filter>
```

---

## FCM (Firebase Cloud Messaging) Setup

1. Go to https://console.firebase.google.com
2. Create project "ONROL"
3. Add Android app with package name `com.onrol.app`
4. Download `google-services.json`
5. Place it at `android/app/google-services.json`
6. In `android/build.gradle`, add: `classpath 'com.google.gms:google-services:4.4.0'`
7. In `android/app/build.gradle`, add at bottom: `apply plugin: 'com.google.gms.google-services'`

---

## Daily development workflow

```bash
# After any React code change:
npm run android:build       # builds dist/ + syncs to android/

# To run on connected device / emulator:
npm run android:run

# To open Gradle project manually:
npm run android:open
```

---

## Release APK

```bash
npm run android:build

# In android/ run:
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release-unsigned.apk

# Sign with keytool:
keytool -genkey -v -keystore onrol-release.keystore -alias onrol -keyalg RSA -keysize 2048 -validity 10000
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore onrol-release.keystore app-release-unsigned.apk onrol
zipalign -v 4 app-release-unsigned.apk onrol-release.apk
```
