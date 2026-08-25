const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('DynimeTimeTracker', {
  sendToken: (token) => ipcRenderer.send('set-auth-token', token),
  onPushNotification: (callback) => ipcRenderer.on('push-notification', (event, data) => callback(data))
});
