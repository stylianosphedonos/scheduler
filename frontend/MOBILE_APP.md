# Resource Scheduler - Mobile App

Native Android and iOS apps built with Capacitor.

## Prerequisites

### For Android Development
- [Android Studio](https://developer.android.com/studio) (latest version)
- Android SDK (API Level 22+)
- Java JDK 17+
- Set `ANDROID_HOME` environment variable

### For iOS Development (macOS only)
- [Xcode](https://developer.apple.com/xcode/) (latest version)
- Xcode Command Line Tools (`xcode-select --install`)
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer Account (for device testing)

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Build & Sync
```bash
# Build web files and sync to native projects
npm run sync
```

### 3. Open in IDE

**Android:**
```bash
npm run open:android
# Opens Android Studio with the project
```

**iOS (macOS only):**
```bash
npm run open:ios
# Opens Xcode with the project
```

## Development Workflow

### Making Changes
1. Edit web files (`index.html`, `app.js`, `styles.css`, etc.)
2. Run `npm run sync` to copy changes to native projects
3. Build and run from Android Studio or Xcode

### Running on Device

**Android:**
```bash
npm run run:android
```

**iOS:**
```bash
npm run run:ios
```

## Building for Production

### Android APK
1. Open Android Studio: `npm run open:android`
2. Go to **Build > Generate Signed Bundle / APK**
3. Select **APK**
4. Create or use existing keystore
5. Select **release** build variant
6. Build

The APK will be in `android/app/release/`

### Android App Bundle (for Play Store)
1. Open Android Studio: `npm run open:android`
2. Go to **Build > Generate Signed Bundle / APK**
3. Select **Android App Bundle**
4. Sign with your upload key
5. Upload to Google Play Console

### iOS IPA (for App Store)
1. Open Xcode: `npm run open:ios`
2. Select your Team in Signing & Capabilities
3. Go to **Product > Archive**
4. In Organizer, click **Distribute App**
5. Select **App Store Connect**
6. Upload to App Store Connect

## Configuration

### App ID
Edit `capacitor.config.json`:
```json
{
  "appId": "com.yourcompany.scheduler",
  "appName": "Resource Scheduler"
}
```

### Server URL (for API calls)
The app needs to connect to your backend server. Update the API URL in `app.js`:
```javascript
const API_BASE = 'https://your-server.com/api';
```

### App Icon
Replace icon files in:
- Android: `android/app/src/main/res/mipmap-*/`
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Splash Screen
Replace splash screen files in:
- Android: `android/app/src/main/res/drawable*/`
- iOS: `ios/App/App/Assets.xcassets/Splash.imageset/`

## App Signing

### Android
Create a keystore for signing release builds:
```bash
keytool -genkey -v -keystore scheduler-release-key.keystore -alias scheduler -keyalg RSA -keysize 2048 -validity 10000
```

### iOS
- Configure signing in Xcode with your Apple Developer Team
- Create App ID in Apple Developer Portal
- Create provisioning profiles

## Troubleshooting

### Android Build Issues
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run sync:android
```

### iOS Build Issues
```bash
# Reinstall pods
cd ios/App
pod deintegrate
pod install
cd ../..
npm run sync:ios
```

### White Screen on App Launch
- Check that API server URL is correct and accessible
- Check browser console for JavaScript errors
- Ensure all files are copied to `dist/`

## Features in Mobile App

All web features work in the mobile app:
- ✅ Dashboard with stats and schedules
- ✅ Schedule management
- ✅ People management with skills
- ✅ Project management
- ✅ AI Scheduler
- ✅ Conflict detection
- ✅ Reports and exports
- ✅ Multi-language support (EN/EL)
- ✅ Dark theme
- ✅ Offline capability (when implemented)

## Support

For issues or questions, contact the development team.

