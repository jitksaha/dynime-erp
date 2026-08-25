const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow = null;
let tray = null;
let syncInterval = null;
let isClockedIn = false;
let elapsedSeconds = 0;
let apiToken = null;
let apiBaseUrl = 'https://app.dynime.com/api/time-tracker';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    title: 'Dynime ERP Time Tracker',
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    }
  });

  // Load Dynime Web Portal
  mainWindow.loadURL('https://app.dynime.com');

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      showNotification('Dynime Time Tracker', 'App is running silently in system tray.');
    }
    return false;
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(getIconPath()).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  updateTrayMenu();
  tray.setToolTip('Dynime Time Tracker - Idle');

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Status: ${isClockedIn ? 'Clocked In (' + formatTime(elapsedSeconds) + ')' : 'Clocked Out'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: isClockedIn ? 'Stop Clock-Out' : 'Start Clock-In',
      click: () => toggleClockState()
    },
    {
      label: 'Open Dynime Dashboard',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Time Tracker',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function toggleClockState() {
  if (!apiToken) {
    showNotification('Authentication Required', 'Please log in via the web portal or paste your pairing token.');
    mainWindow.show();
    return;
  }

  const endpoint = isClockedIn ? `${apiBaseUrl}/clock-out` : `${apiBaseUrl}/clock-in`;
  
  axios.post(endpoint, { platform: process.platform }, {
    headers: { Authorization: `Bearer ${apiToken}` }
  }).then(res => {
    if (res.data.status === 'success') {
      isClockedIn = !isClockedIn;
      showNotification(
        isClockedIn ? 'Clock-In Success' : 'Clock-Out Success',
        isClockedIn ? 'Background time tracking activated.' : 'Session saved. Time tracking stopped.'
      );
      updateTrayMenu();
      if (isClockedIn) {
        startAutoSyncLoop();
      } else {
        stopAutoSyncLoop();
      }
    }
  }).catch(err => {
    showNotification('Sync Error', 'Failed to connect to Dynime ERP API.');
  });
}

let screenshotTimeout = null;

function scheduleRandomScreenshot() {
  if (screenshotTimeout) clearTimeout(screenshotTimeout);
  if (!isClockedIn) return;

  // Random interval between 5 and 12 minutes (in milliseconds)
  const randomDelayMs = (Math.floor(Math.random() * (12 - 5 + 1)) + 5) * 60 * 1000;

  screenshotTimeout = setTimeout(() => {
    if (isClockedIn && apiToken && mainWindow) {
      captureAndUploadScreenshot();
    }
    // Schedule next random screenshot
    scheduleRandomScreenshot();
  }, randomDelayMs);
}

function captureAndUploadScreenshot() {
  if (!mainWindow) return;
  mainWindow.webContents.capturePage().then(image => {
    const buffer = image.toJPEG(60);
    const FormData = require('form-data');
    const form = new FormData();
    form.append('screenshot', buffer, { filename: 'screenshot.jpg', contentType: 'image/jpeg' });
    form.append('active_window', 'Dynime Desktop Tracker Workspace');

    axios.post(`${apiBaseUrl}/upload-screenshot`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiToken}`
      }
    }).then(res => {
      console.log('Random screenshot uploaded successfully.');
    }).catch(err => {
      console.log('Screenshot upload error:', err.message);
    });
  }).catch(err => console.log('Capture page error:', err.message));
}

function startAutoSyncLoop() {
  if (syncInterval) clearInterval(syncInterval);
  scheduleRandomScreenshot();

  syncInterval = setInterval(() => {
    if (isClockedIn) {
      elapsedSeconds += 60;
      updateTrayMenu();
      tray.setToolTip(`Dynime Time Tracker - Active: ${formatTime(elapsedSeconds)}`);

      // Heartbeat API ping
      if (apiToken) {
        axios.post(`${apiBaseUrl}/sync-heartbeat`, {
          elapsed_seconds: elapsedSeconds,
          platform: process.platform
        }, {
          headers: { Authorization: `Bearer ${apiToken}` }
        }).catch(err => console.log('Heartbeat sync error:', err.message));
      }
    }
  }, 60000);
}

function stopAutoSyncLoop() {
  if (syncInterval) clearInterval(syncInterval);
  if (screenshotTimeout) clearTimeout(screenshotTimeout);
  tray.setToolTip('Dynime Time Tracker - Idle');
}

function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: getIconPath() }).show();
  }
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}

function getIconPath() {
  return path.join(__dirname, 'icon.png');
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
