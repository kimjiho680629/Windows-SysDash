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

const { execSync } = require('child_process');

function getSysDashExePath() {
  const launcherPath = path.resolve(__dirname, '..', 'SysDash.exe');
  if (fs.existsSync(launcherPath)) return launcherPath;
  const standalonePath = path.resolve(__dirname, '..', 'release', 'SysDash', 'SysDash.exe');
  if (fs.existsSync(standalonePath)) return standalonePath;
  return process.execPath;
}

function isAutoStartEnabled() {
  try {
    const regCheck = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v SysDash', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (regCheck && regCheck.includes('SysDash')) return true;
  } catch (e) {}

  try {
    const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const shortcutPath = path.join(startupDir, 'SysDash.lnk');
    if (fs.existsSync(shortcutPath)) return true;
  } catch (e) {}

  return false;
}

function enableAutoStart() {
  const exePath = getSysDashExePath();
  const workDir = path.dirname(exePath);

  // 1. Windows 레지스트리 자동 실행 등록
  try {
    execSync(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v SysDash /t REG_SZ /d "\\"${exePath}\\"" /f`, { stdio: 'ignore' });
  } catch (e) {
    console.error('Failed to register registry auto-start:', e);
  }

  // 2. 시작 프로그램 폴더 바로가기(.lnk) 생성 (작업 디렉토리 보장)
  try {
    const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const shortcutPath = path.join(startupDir, 'SysDash.lnk');
    const psScript = `$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}'); $s.TargetPath = '${exePath.replace(/'/g, "''")}'; $s.WorkingDirectory = '${workDir.replace(/'/g, "''")}'; $s.Save()`;
    execSync(`powershell -NoProfile -Command "${psScript}"`, { stdio: 'ignore' });
  } catch (e) {
    console.error('Failed to create startup shortcut:', e);
  }

  // 3. Electron 내부 로그인 아이템 등록
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: exePath
    });
  } catch (e) {}

  const config = loadConfig();
  config.autoStart = true;
  saveConfig(config);
  return true;
}

function disableAutoStart() {
  // 1. 레지스트리 삭제
  try {
    execSync('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v SysDash /f', { stdio: 'ignore' });
  } catch (e) {}

  // 2. 시작 프로그램 바로가기 삭제
  try {
    const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const shortcutPath = path.join(startupDir, 'SysDash.lnk');
    if (fs.existsSync(shortcutPath)) {
      fs.unlinkSync(shortcutPath);
    }
  } catch (e) {}

  // 3. Electron 내부 로그인 아이템 해제
  try {
    app.setLoginItemSettings({
      openAtLogin: false
    });
  } catch (e) {}

  const config = loadConfig();
  config.autoStart = false;
  saveConfig(config);
  return false;
}

function relocateToMonitor3() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const targetDisplay = findMonitor3();
  const currentBounds = mainWindow.getBounds();

  // 이미 모니터 3 위치에 적합하게 배치되어 있는지 확인
  const matchesTarget = 
    Math.abs(currentBounds.x - targetDisplay.bounds.x) < 30 &&
    Math.abs(currentBounds.y - targetDisplay.bounds.y) < 30 &&
    Math.abs(currentBounds.width - targetDisplay.bounds.width) < 30 &&
    Math.abs(currentBounds.height - targetDisplay.bounds.height) < 30;

  if (!matchesTarget) {
    console.log(`[SysDash] Relocating to Monitor 3: ${targetDisplay.bounds.x}, ${targetDisplay.bounds.y} (${targetDisplay.bounds.width}x${targetDisplay.bounds.height})`);
    mainWindow.setBounds({
      x: targetDisplay.bounds.x,
      y: targetDisplay.bounds.y,
      width: targetDisplay.bounds.width,
      height: targetDisplay.bounds.height
    });
  }
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

  // 윈도우 부팅 시 다중 모니터 지연 인식에 대비한 안전 재배치 가드
  setTimeout(relocateToMonitor3, 1000);
  setTimeout(relocateToMonitor3, 3000);
  setTimeout(relocateToMonitor3, 7000);

  collector = new SystemCollector();
  collector.init().then(() => {
    collector.getMetrics().then(data => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('metrics-update', data);
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

ipcMain.handle('get-autostart-status', () => {
  return isAutoStartEnabled();
});

ipcMain.handle('toggle-autostart', () => {
  const currentlyEnabled = isAutoStartEnabled();
  if (currentlyEnabled) {
    return disableAutoStart();
  } else {
    return enableAutoStart();
  }
});

app.whenReady().then(() => {
  createWindow();

  // 모니터 동적 감지 이벤트 (부팅 중 모니터가 늦게 인식되거나 해상도 변경 시 모니터 3으로 자동 안착)
  screen.on('display-added', () => {
    setTimeout(relocateToMonitor3, 500);
  });
  screen.on('display-metrics-changed', () => {
    setTimeout(relocateToMonitor3, 500);
  });

  // 초기 자동 시작 설정 동기화
  const config = loadConfig();
  if (config.autoStart === undefined || config.autoStart === true) {
    enableAutoStart();
  }
});

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

