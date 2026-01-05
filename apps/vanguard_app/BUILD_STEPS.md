# Vanguard App Build Guide

## Prerequisites
- Install Xcode and Command Line Tools: `xcode-select --install`
- Install Android Studio, SDK, Platform Tools, and create an emulator (AVD)
- Install Flutter (stable) on PATH:
  - `git clone https://github.com/flutter/flutter.git -b stable`
  - `export PATH="$PATH:$HOME/flutter/bin"`
- Install CocoaPods: `sudo gem install cocoapods`
- Optional: Java JDK 17 for Android builds (via Android Studio or Homebrew)
- Verify setup: `flutter doctor`

## Project Setup
- Navigate to project root:
  - `cd /Users/kevin/KVN_Coordinator_System/vanguard_app`
- Generate iOS/Android folders while preserving existing Dart code:
  - `flutter create .`

## Networking Configuration (WebSocket Hub)
- The app uses a hub URL defined in code (`lib/services/websocket_service.dart`). It is configurable at build time via `--dart-define`:
  - `--dart-define=HUB_URL=wss://your-hub/ws`
- Prefer `wss://` in production to avoid cleartext issues.
- If you must use `ws://` for local dev:
  - iOS (`ios/Runner/Info.plist`):
    - Add:
      ```
      <key>NSAppTransportSecurity</key>
      <dict>
        <key>NSAllowsArbitraryLoads</key><true/>
      </dict>
      ```
    - Or create a domain-specific ATS exception.
  - Android (`android/app/src/main/AndroidManifest.xml`):
    - Add internet permission:
      - `<uses-permission android:name="android.permission.INTERNET" />`
    - Enable cleartext for the app if using `ws://`:
      - `<application android:usesCleartextTraffic="true" ...>`
- Connecting to a server running on your Mac:
  - Android emulator: use `10.0.2.2` to reach host machine (e.g., `ws://10.0.2.2/ws`)
  - iOS simulator: use your Mac’s LAN IP (e.g., `ws://192.168.x.x/ws`)

## Dependencies and Static Checks
- Fetch packages: `flutter pub get`
- Static analysis: `flutter analyze`

## Running the App
- iOS Simulator:
  - `open -a Simulator`
  - `flutter run -d ios --dart-define=HUB_URL=wss://your-hub/ws`
- Android Emulator:
  - Start an AVD in Android Studio
  - `flutter devices`
  - `flutter run -d <emulator_id> --dart-define=HUB_URL=wss://your-hub/ws`

## Release Builds
- iOS:
  - Open `ios/Runner.xcworkspace` in Xcode
  - Set a unique bundle identifier and signing team
  - Product → Archive → Distribute via TestFlight/App Store
- Android:
  - Create a signing key and configure `android/key.properties`
  - Build App Bundle: `flutter build appbundle`
  - Upload the generated `.aab` to the Play Console

## Troubleshooting
- `flutter` or `dart` not found: ensure PATH includes `$HOME/flutter/bin`
- ATS or cleartext errors: switch to `wss://` or add the iOS/Android exceptions above
- Emulator cannot reach local server:
  - Android: use `10.0.2.2`
  - iOS: use Mac’s LAN IP
- Code changes not reflected: run `flutter clean` then `flutter pub get` and re-run

## Code Pointers
- Entry and theme: `lib/main.dart`
- Themed dashboard: `lib/screens/dashboard_screen.dart`
- App state: `lib/providers/system_provider.dart`
- WebSocket client: `lib/services/websocket_service.dart`
- Theme modules: `lib/theme/`

## Optional Enhancements
- Theme switching with `ThemeProvider` and `shared_preferences` (see `.trae/documents/theme_architecture.md`)
- Move hub URL to environment or config service for multi-environment builds
