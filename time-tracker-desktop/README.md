# Dynime Time Tracker Desktop App (Windows & Mac)

Official cross-platform time tracking and auto-sync desktop application for Dynime ERP.

## Features
- **WebView Container**: Renders `app.dynime.com` natively with session persistence.
- **System Tray Widget**: Taskbar icon (Windows) and Menu bar item (Mac) with quick Clock-In / Clock-Out toggle.
- **Auto-Sync Engine**: Sends 60s background heartbeat pings to `/api/time-tracker/sync-heartbeat`.
- **Native OS Push Notifications**: Windows Toast & Mac OS Notification Center alerts for shift start/end and HR messages.
- **Background Screenshot Sync**: Sends periodic activity logs and screenshots linked to employee attendance.

## How to Build Executables

### 1. Install Dependencies
```bash
cd time-tracker-desktop
npm install
```

### 2. Run Locally in Development Mode
```bash
npm start
```

### 3. Build Windows Executable (.exe)
```bash
npm run build:win
```
The output setup file `Dynime-TimeTracker-Setup.exe` will be generated in `dist/`.

### 4. Build macOS App & Installer (.dmg)
```bash
npm run build:mac
```
The output file `Dynime-TimeTracker-Mac.dmg` will be generated in `dist/`.
