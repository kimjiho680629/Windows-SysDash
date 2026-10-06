const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const SystemCollector = require('./collector');

let mainWindow = null;
let collector = null;
let metricsInterval = null;
let isAlwaysOnTop = false;

// 설정 파일 경로
function getConfigPath() {
  try {
    return path.join(app.getPath('userData'), 'sysdash_config.json');
  } catch (e) {
    return path.join(process.cwd(), 'sysdash_config.json');
  }
}

function loadConfig() {
  try {
    const cp = getConfigPath();
    if (fs.existsSync(cp)) {
      return JSON.parse(fs.readFileSync(cp, 'utf8'));
    }
  } catch (e) {}
  return { theme: 'ink', targetDisplayIndex: 2 }; // 기본 테마는 Ink, 기본 타겟은 3번째 모니터
}

function saveConfig(config) {
  try {
    const cp = getConfigPath();
    fs.writeFileSync(cp, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {}
}

function getDisplaysInfo() {
  const displays = screen.getAllDisplays();
  return displays.map((d, index) => {
    const isTarget3 = (d.bounds.x === 3425 && d.bounds.width === 2048) || (index === 2);
    return {
      index,
      number: index + 1,
      id: d.id,
      bounds: d.bounds,
      workArea: d.workArea,
      isPrimary: d.bounds.x === 0 && d.bounds.y === 0,
      isMonitor3: isTarget3,
      label: `모니터 ${index + 1} (${d.bounds.width}×${d.bounds.height}${isTarget3 ? ' - 권장/모니터3' : (d.bounds.x === 0 ? ' - 메인' : '')})`
    };
  });
}

function findMonitor3() {
  const displays = screen.getAllDisplays();
  // 1. x좌표 3425, 폭 2048인 모니터 3 우선 검색
  let m3 = displays.find(d => d.bounds.x === 3425 || (d.bounds.width === 2048 && d.bounds.height === 1152));
  if (m3) return m3;

  // 2. 3번째 모니터 (인덱스 2)
  if (displays.length >= 3) {
    return displays[2];
  }

  // 3. 마지막 모니터 또는 메인 모니터
  return displays[displays.length - 1] || screen.getPrimaryDisplay();
}

function createWindow() {
  const config = loadConfig();
  const targetDisplay = findMonitor3();

  // 모니터 3의 위치 및 크기 전체에 맞게 윈도우 생성
  const bounds = targetDisplay.bounds;

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    transparent: false,
    backgroundColor: '#0c0d11',
    alwaysOnTop: isAlwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    ...(fs.existsSync(path.join(__dirname, 'renderer/assets/icon.png')) ? { icon: path.join(__dirname, 'renderer/assets/icon.png') } : {})
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  collector = new SystemCollector();
  collector.init().then(() => {
    collector.getMetrics().then(data => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('metrics-update', data);

        // 캡처 생성 (화면 검증용)
        setTimeout(async () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            await mainWindow.webContents.executeJavaScript("setTheme('ink');");
            setTimeout(async () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                const imgInk = await mainWindow.webContents.capturePage();
                fs.writeFileSync(path.join(__dirname, '../preview_wide_ink.png'), imgInk.toPNG());

                await mainWindow.webContents.executeJavaScript("setTheme('snow');");
                setTimeout(async () => {
                  if (mainWindow && !mainWindow.isDestroyed()) {
                    const imgSnow = await mainWindow.webContents.capturePage();
                    fs.writeFileSync(path.join(__dirname, '../preview_wide_snow.png'), imgSnow.toPNG());

                    const cfg = loadConfig();
                    await mainWindow.webContents.executeJavaScript(`setTheme('${cfg.theme || 'ink'}');`);
                  }
                }, 700);
              }
            }, 700);
          }
        }, 1500);
      }
    });

    // 1초 주기로 실시간 전송
    metricsInterval = setInterval(async () => {
      try {
        if (mainWindow && !mainWindow.isDestroyed()) {
          const data = await collector.getMetrics();
          mainWindow.webContents.send('metrics-update', data);
        }
      } catch (err) {
        console.error('Metrics error:', err);
      }
    }, 1000);
  });

  mainWindow.on('closed', () => {
    if (metricsInterval) clearInterval(metricsInterval);
    mainWindow = null;
  });
}

// IPC 통신 설정
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    const isFull = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFull);
    return !isFull;
  }
  return false;
});

ipcMain.handle('window-toggle-top', () => {
  if (mainWindow) {
    isAlwaysOnTop = !isAlwaysOnTop;
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
    return isAlwaysOnTop;
  }
  return false;
});

ipcMain.handle('get-displays', () => {
  return getDisplaysInfo();
});

ipcMain.handle('set-target-display', (event, displayIndex) => {
  const displays = screen.getAllDisplays();
  if (displays[displayIndex] && mainWindow) {
    const d = displays[displayIndex];
    mainWindow.setBounds({
      x: d.bounds.x,
      y: d.bounds.y,
      width: d.bounds.width,
      height: d.bounds.height
    });
    const config = loadConfig();
    config.targetDisplayIndex = displayIndex;
    saveConfig(config);
    return true;
  }
  return false;
});

ipcMain.on('save-theme', (event, theme) => {
  const config = loadConfig();
  config.theme = theme;
  saveConfig(config);
});

ipcMain.handle('get-initial-theme', () => {
  const config = loadConfig();
  return config.theme || 'ink';
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (metricsInterval) clearInterval(metricsInterval);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
