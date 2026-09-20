# Hostel office (React Native)

This is the mobile app for the Hostel Management System. It uses the same Express API as the web app, with the same staff and resident screens.

## What you need

1. Node.js 20+
2. The API running from `server/` (default `http://localhost:5000`)
3. Expo Go on your phone, or an Android/iOS simulator

## Install and start

From the repo root:

```bash
cd mobile
npm install
npx expo start
```

Or from the repo root after `npm run install-all`:

```bash
npm run mobile
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Point the app at the API

The app already tries to use your computer’s LAN IP (from Metro) plus port 5000.

If that is wrong, set this before starting Expo:

```bash
# Windows PowerShell
$env:EXPO_PUBLIC_API_URL="http://YOUR_LAN_IP:5000"

# macOS / Linux
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:5000 npx expo start
```

Notes:

- Phone on the same Wi-Fi: use your PC’s LAN IP, for example `http://192.168.1.10:5000`
- Android emulator: `http://10.0.2.2:5000`
- iOS simulator: `http://localhost:5000`

The API must be running. Phone and computer must be on the same network for a physical device.

## Sign in

Same as the website.

- **I live here**: student ID or email. First password is the student ID, then change it from Forgot password.
- **I run the hostel**: staff username or email (demo: `admin` / `admin123`)

Super admins pick a hostel from the side menu before lists load.

## Screens included

Staff: Home, People, Rooms, Staff, Payments, Attendance, Visitors, Meals, Leave, Problems, Repairs, Room change, Stock, Files, Money report, Alerts, Hostels, Managers.

Residents: Home, My details, My payments, My attendance, Problems, Leave, Change room, Alerts.

File uploads for ID cards are still done in the web app. Everything else uses the same REST endpoints.
