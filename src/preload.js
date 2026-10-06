const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onMetricsUpdate: (callback) => {
    ipcRenderer.on('metrics-update', (event, data) => callback(data));
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window-toggle-top'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  setTargetDisplay: (displayIndex) => ipcRenderer.invoke('set-target-display', displayIndex),
  saveTheme: (theme) => ipcRenderer.send('save-theme', theme),
  getInitialTheme: () => ipcRenderer.invoke('get-initial-theme')
});
