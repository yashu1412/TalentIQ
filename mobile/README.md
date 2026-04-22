# TalentIQ Mobile (Flutter)

This folder contains the Flutter mobile client for the existing TalentIQ FastAPI backend.

## Setup

1. Install Flutter SDK and verify:
   - `flutter --version`
2. (If needed) generate platform folders:
   - `flutter create .`
3. Install dependencies:
   - `flutter pub get`
4. Choose a flavor env file and run:
   - Dev: `flutter run --dart-define=APP_FLAVOR=dev --dart-define=ENV_FILE=.env.dev`
   - Staging: `flutter run --dart-define=APP_FLAVOR=staging --dart-define=ENV_FILE=.env.staging`
   - Prod (local check): `flutter run --dart-define=APP_FLAVOR=prod --dart-define=ENV_FILE=.env.prod`

## Flavors and Env Files

- `.env.dev` -> local emulator backend (`http://10.0.2.2:8000/v1`)
- `.env.staging` -> staging backend URL
- `.env.prod` -> production backend URL

`main.dart` reads:
- `APP_FLAVOR` from `--dart-define`
- `ENV_FILE` from `--dart-define`

## CI Checks

GitHub Actions workflow is included at `.github/workflows/mobile-ci.yml`.

CI runs on changes under `mobile/**` and executes:
- `flutter pub get`
- `flutter analyze`
- `flutter test`
- `flutter build apk --debug` (dev flavor)

## Test Harness

Starter test harness is included:
- `test/app_env_test.dart` for environment/flavor behavior.

Run locally:
- `flutter test`

## Production Build Commands

- Android (release):
  - `flutter build apk --release --dart-define=APP_FLAVOR=prod --dart-define=ENV_FILE=.env.prod`
- Android app bundle:
  - `flutter build appbundle --release --dart-define=APP_FLAVOR=prod --dart-define=ENV_FILE=.env.prod`
- iOS (release):
  - `flutter build ios --release --dart-define=APP_FLAVOR=prod --dart-define=ENV_FILE=.env.prod`

## Release Readiness Checklist

- [ ] **Backend readiness**
  - [ ] Production API base URL verified in `.env.prod`
  - [ ] Auth token flow validated against production auth provider
  - [ ] Feature flags reviewed for mobile-visible modules

- [ ] **App quality**
  - [ ] `flutter analyze` passes
  - [ ] `flutter test` passes
  - [ ] Smoke tested on Android emulator + physical device
  - [ ] Smoke tested on iOS simulator/device

- [ ] **Resilience**
  - [ ] Offline cache fallback validated (tracker + analytics)
  - [ ] Retry/backoff behavior validated on network toggles
  - [ ] Notification deep links validated:
    - [ ] `/tracker?appId=...`
    - [ ] `/interview`
    - [ ] `/roadmap?role=...&weeks=...`

- [ ] **Security**
  - [ ] No secrets committed in repo
  - [ ] Only public base URLs in env files
  - [ ] Secure storage token lifecycle verified (login/logout)

- [ ] **Observability**
  - [ ] Crash handlers verified (`FlutterError`, `PlatformDispatcher`, zoned guard)
  - [ ] Telemetry log flow reviewed in release build logs

- [ ] **Store packaging**
  - [ ] Android signing config configured
  - [ ] iOS signing/profile configured
  - [ ] App icons/splash/privacy policy links finalized
  - [ ] Version + build number bumped (`pubspec.yaml`)

## Notes

- Login currently uses token paste for dev-mode auth.
- Replace placeholder staging/prod API URLs with real endpoints before release.
