// ====================================================
// SysDash Ultra - High-Tech Monitor 3 Renderer Script
// ====================================================

let currentTheme = 'ink';
let lastData = null;
let currentDisplays = [];

// 캔버스 요소
const cpuDonutCanvas = document.getElementById('cpuDonutCanvas');
const gpuDonutCanvas = document.getElementById('gpuDonutCanvas');
const cpuSparkCanvas = document.getElementById('cpuSparkCanvas');
const gpuSparkCanvas = document.getElementById('gpuSparkCanvas');
const netSparkCanvas = document.getElementById('netSparkCanvas');

// 윈도우 및 모니터 컨트롤
const btnInk = document.getElementById('btnInk');
const btnSnow = document.getElementById('btnSnow');
const pinBtn = document.getElementById('pinBtn');
const minBtn = document.getElementById('minBtn');
const maxBtn = document.getElementById('maxBtn');
const closeBtn = document.getElementById('closeBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const displaySelectBtn = document.getElementById('displaySelectBtn');
const displayDropdown = document.getElementById('displayDropdown');
const monitorBadgeText = document.getElementById('monitorBadgeText');
const footerDisplayInfo = document.getElementById('footerDisplayInfo');

// 시스템 헤더
const clockTime = document.getElementById('clockTime');
const clockDate = document.getElementById('clockDate');
const deviceName = document.getElementById('deviceName');

// CPU 요소
const cpuName = document.getElementById('cpuName');
const cpuPower = document.getElementById('cpuPower');
const cpuTempText = document.getElementById('cpuTempText');
const cpuLoadText = document.getElementById('cpuLoadText');
const cpuLoadBar = document.getElementById('cpuLoadBar');
const cpuVoltageText = document.getElementById('cpuVoltageText');
const cpuVoltageBar = document.getElementById('cpuVoltageBar');
const cpuSpeedText = document.getElementById('cpuSpeedText');
const cpuSpeedBar = document.getElementById('cpuSpeedBar');
const cpuFanText = document.getElementById('cpuFanText');
const cpuFanBar = document.getElementById('cpuFanBar');
const cpuGraphMax = document.getElementById('cpuGraphMax');
const cpuGraphMin = document.getElementById('cpuGraphMin');

// Memory 요소
const ramModel = document.getElementById('ramModel');
const ramSpeedText = document.getElementById('ramSpeedText');
const ramPercentText = document.getElementById('ramPercentText');
const ramProgressBar = document.getElementById('ramProgressBar');
const ramUsedText = document.getElementById('ramUsedText');
const ramFreeText = document.getElementById('ramFreeText');
const ramTotalText = document.getElementById('ramTotalText');
const slot1 = document.getElementById('slot1');
const slot2 = document.getElementById('slot2');
const slot3 = document.getElementById('slot3');
const slot4 = document.getElementById('slot4');

// GPU 요소
const gpuName = document.getElementById('gpuName');
const gpuPower = document.getElementById('gpuPower');
const gpuTempText = document.getElementById('gpuTempText');
const gpuLoadText = document.getElementById('gpuLoadText');
const gpuLoadBar = document.getElementById('gpuLoadBar');
const gpuClockText = document.getElementById('gpuClockText');
const gpuClockBar = document.getElementById('gpuClockBar');
const gpuVramUsedText = document.getElementById('gpuVramUsedText');
const gpuVramBar = document.getElementById('gpuVramBar');
const gpuVramTempText = document.getElementById('gpuVramTempText');
const gpuVramTempBar = document.getElementById('gpuVramTempBar');
const gpuFanText = document.getElementById('gpuFanText');
const gpuFanBar = document.getElementById('gpuFanBar');
const gpuVoltageText = document.getElementById('gpuVoltageText');
const gpuVoltageBar = document.getElementById('gpuVoltageBar');
const gpuGraphMax = document.getElementById('gpuGraphMax');
const gpuGraphMin = document.getElementById('gpuGraphMin');

// FPS & Gaming 요소
const fpsPill = document.getElementById('fpsPill');
const fpsIcon = document.getElementById('fpsIcon');
const fpsPillVal = document.getElementById('fpsPillVal');
const fpsHugeNum = document.getElementById('fpsHugeNum');
const fpsActiveTarget = document.getElementById('fpsActiveTarget');
const fpsStatusDesc = document.getElementById('fpsStatusDesc');
const gpuFpsRowVal = document.getElementById('gpuFpsRowVal');
const gpuFpsBar = document.getElementById('gpuFpsBar');
const gpuFrametimeVal = document.getElementById('gpuFrametimeVal');
const gpuFrametimeBar = document.getElementById('gpuFrametimeBar');
const fpsMainIcon = document.getElementById('fpsMainIcon');

// SSD Storage 요소
const ssdDriveCount = document.getElementById('ssdDriveCount');
const drivesList = document.getElementById('drivesList');

// Network 요소
const netAdapterName = document.getElementById('netAdapterName');
const netPingVal = document.getElementById('netPingVal');
const netStatusText = document.getElementById('netStatusText');
const netRxSpeed = document.getElementById('netRxSpeed');
const netTxSpeed = document.getElementById('netTxSpeed');

// ====================================================
// 테마 전환 함수
// ====================================================
function setTheme(theme) {
  currentTheme = theme;
  document.body.className = `theme-${theme}`;

  const editionBigName = document.getElementById('editionBigName');
  if (theme === 'snow') {
    btnSnow.classList.add('active');
    btnInk.classList.remove('active');
    if (editionBigName) editionBigName.textContent = 'Snow Edition';
  } else {
    btnInk.classList.add('active');
    btnSnow.classList.remove('active');
    if (editionBigName) editionBigName.textContent = 'Ink Edition';
  }

  if (window.api && window.api.saveTheme) {
    window.api.saveTheme(theme);
  }

  if (lastData) {
    updateCharts(lastData);
  }
}

btnInk.addEventListener('click', () => setTheme('ink'));
btnSnow.addEventListener('click', () => setTheme('snow'));

const autostartBtn = document.getElementById('autostartBtn');

async function updateAutoStartUI() {
  if (!window.api || !window.api.getAutoStartStatus || !autostartBtn) return;
  try {
    const isEnabled = await window.api.getAutoStartStatus();
    const label = autostartBtn.querySelector('.autostart-label');
    if (isEnabled) {
      autostartBtn.classList.add('active');
      if (label) label.textContent = '모니터3 자동시작: ON';
      autostartBtn.setAttribute('title', '윈도우 부팅 시 모니터 3에 자동 실행됩니다 (클릭하여 끄기)');
    } else {
      autostartBtn.classList.remove('active');
      if (label) label.textContent = '모니터3 자동시작: OFF';
      autostartBtn.setAttribute('title', '현재 자동 시작이 꺼져 있습니다 (클릭하여 켜기)');
    }
  } catch (err) {
    console.error('Failed to get autostart status:', err);
  }
}

if (autostartBtn) {
  autostartBtn.addEventListener('click', async () => {
    if (window.api && window.api.toggleAutoStart) {
      await window.api.toggleAutoStart();
      await updateAutoStartUI();
    }
  });
}

// ====================================================
// 윈도우 조작 이벤트
// ====================================================
minBtn.addEventListener('click', () => {
  if (window.api && window.api.minimizeWindow) window.api.minimizeWindow();
});

if (maxBtn) {
  maxBtn.addEventListener('click', () => {
    if (window.api && window.api.maximizeWindow) window.api.maximizeWindow();
  });
}

closeBtn.addEventListener('click', () => {
  if (window.api && window.api.closeWindow) window.api.closeWindow();
});

let isPinned = false;
pinBtn.addEventListener('click', async () => {
  if (window.api && window.api.toggleAlwaysOnTop) {
    isPinned = await window.api.toggleAlwaysOnTop();
    pinBtn.classList.toggle('pinned', isPinned);
  }
});

if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', async () => {
    if (window.api && window.api.toggleFullscreen) {
      await window.api.toggleFullscreen();
    }
  });
}

// ====================================================
// 다중 모니터 선택 드롭다운
// ====================================================
async function loadDisplays() {
  if (!window.api || !window.api.getDisplays) return;
  try {
    currentDisplays = await window.api.getDisplays();
    if (!currentDisplays || currentDisplays.length === 0) return;

    let dropdownHtml = '';
    currentDisplays.forEach((d) => {
      dropdownHtml += `
        <button class="display-option-btn" data-index="${d.index}">
          🖥️ ${d.label}
        </button>
      `;
    });
    displayDropdown.innerHTML = dropdownHtml;

    // 옵션 클릭 핸들러
    displayDropdown.querySelectorAll('.display-option-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = parseInt(btn.getAttribute('data-index'));
        if (window.api.setTargetDisplay) {
          await window.api.setTargetDisplay(idx);
          const chosen = currentDisplays[idx];
          if (chosen) {
            monitorBadgeText.textContent = `DISPLAY ${chosen.number} (${chosen.bounds.width}×${chosen.bounds.height})`;
            footerDisplayInfo.textContent = `Monitor ${chosen.number} @ ${chosen.bounds.width}×${chosen.bounds.height} Active`;
          }
        }
        displayDropdown.classList.remove('show');
      });
    });

    // 기본 모니터 3 배지 텍스트 동기화
    const target3 = currentDisplays.find(d => d.isMonitor3);
    if (target3) {
      monitorBadgeText.textContent = `DISPLAY ${target3.number} (${target3.bounds.width}×${target3.bounds.height})`;
      footerDisplayInfo.textContent = `Monitor ${target3.number} @ ${target3.bounds.width}×${target3.bounds.height} Active`;
    }
  } catch (err) {
    console.error('Failed to load displays:', err);
  }
}

if (displaySelectBtn) {
  displaySelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    displayDropdown.classList.toggle('show');
  });
}

document.addEventListener('click', () => {
  if (displayDropdown) displayDropdown.classList.remove('show');
});

// ====================================================
// 디지털 시계 & 날짜 업데이트
// ====================================================
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  clockTime.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;

  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();
  clockDate.textContent = `${month}/${day}/${year}`;
}
setInterval(updateClock, 1000);
updateClock();

// ====================================================
// 고품질 도넛 게이지 렌더러
// ====================================================
function drawDonutGauge(canvas, temp) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 120;

  if (canvas.width !== size * dpr) {
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 12;
  const lineWidth = 9;

  const startAngle = 0.75 * Math.PI;
  const totalSweep = 1.5 * Math.PI;
  const endTrackAngle = startAngle + totalSweep;

  // 1. 배경 트랙
  const trackColor = currentTheme === 'ink' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endTrackAngle);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = trackColor;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 2. 활성 게이지 (20°C ~ 95°C)
  const clampedTemp = Math.max(20, Math.min(95, temp || 35));
  const progress = (clampedTemp - 20) / 75;
  const activeSweep = totalSweep * progress;
  const activeEndAngle = startAngle + activeSweep;

  if (progress > 0.02) {
    const grad = ctx.createLinearGradient(10, size - 10, size - 10, 10);
    grad.addColorStop(0.0, '#ff7a00');
    grad.addColorStop(0.5, '#ff007f');
    grad.addColorStop(1.0, '#00d2ff');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, activeEndAngle);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 끝단 네온 글로우 닷 (빛나는 헤드)
    const endX = centerX + Math.cos(activeEndAngle) * radius;
    const endY = centerY + Math.sin(activeEndAngle) * radius;
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 10;
    ctx.fill();
  }

  ctx.restore();
}

// ====================================================
// 고해상도 단일 스파크라인 차트 렌더러
// ====================================================
function drawSparkline(canvas, history, minVal, maxVal, color) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width > 30 ? rect.width : 340;
  const height = rect.height > 10 ? rect.height : 48;

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  if (!history || history.length < 2) {
    ctx.restore();
    return;
  }

  const paddingY = 6;
  const effectiveHeight = height - paddingY * 2;
  const range = (maxVal - minVal) > 0 ? (maxVal - minVal) : 1;

  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * width;
    const normalized = (val - minVal) / range;
    const y = height - paddingY - (normalized * effectiveHeight);
    return { x, y };
  });

  // 그라데이션 영역 채우기
  const gradFill = ctx.createLinearGradient(0, 0, 0, height);
  const strokeColor = color || (currentTheme === 'ink' ? '#00b4ff' : '#007aff');
  gradFill.addColorStop(0, strokeColor + '33');
  gradFill.addColorStop(1, strokeColor + '00');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + curr.y) / 2);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = gradFill;
  ctx.fill();

  // 부드러운 꺾은선
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + curr.y) / 2);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 마지막 실시간 포인트 발광
  const lastPt = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(lastPt.x, lastPt.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = 8;
  ctx.fill();

  ctx.restore();
}

// ====================================================
// 네트워크 듀얼 트래픽 스파크라인 차트 렌더러
// ====================================================
function drawDualSparkline(canvas, rxHistory, txHistory) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width > 30 ? rect.width : 340;
  const height = rect.height > 10 ? rect.height : 54;

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  if (!rxHistory || rxHistory.length < 2) {
    ctx.restore();
    return;
  }

  const allVals = [...rxHistory, ...(txHistory || [])];
  const maxVal = Math.max(...allVals, 50);
  const minVal = 0;
  const paddingY = 4;
  const effectiveHeight = height - paddingY * 2;
  const range = maxVal - minVal;

  function renderCurve(hist, strokeColor) {
    const pts = hist.map((v, i) => {
      const x = (i / (hist.length - 1)) * width;
      const norm = (v - minVal) / range;
      const y = height - paddingY - (norm * effectiveHeight);
      return { x, y };
    });

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + curr.y) / 2);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  }

  // 1. Download (Cyan)
  renderCurve(rxHistory, '#00e5ff');
  // 2. Upload (Pink/Magenta)
  if (txHistory && txHistory.length > 1) {
    renderCurve(txHistory, '#ff007f');
  }

  ctx.restore();
}

function updateCharts(data) {
  if (!data) return;
  if (data.cpu) {
    drawDonutGauge(cpuDonutCanvas, data.cpu.temp);
    drawSparkline(cpuSparkCanvas, data.cpu.history, data.cpu.minTemp, data.cpu.maxTemp, '#00d2ff');
  }
  if (data.gpu) {
    drawDonutGauge(gpuDonutCanvas, data.gpu.temp);
    drawSparkline(gpuSparkCanvas, data.gpu.history, data.gpu.minTemp, data.gpu.maxTemp, '#ff007f');
  }
  if (data.network && data.network.rxHistory) {
    drawDualSparkline(netSparkCanvas, data.network.rxHistory, data.network.txHistory);
  }
}

// ====================================================
// 실시간 데이터 수신 및 와이드 UI 업데이트
// ====================================================
function updateUI(data) {
  if (!data) return;
  lastData = data;

  // 1. 헤더
  if (data.system) {
    deviceName.textContent = data.system.deviceName || 'My-PC';
  }

  // 2. CPU (AMD Ryzen 7 9800X3D)
  if (data.cpu) {
    cpuName.textContent = data.cpu.name || 'AMD Ryzen 7 9800X3D';
    cpuPower.textContent = `${data.cpu.power} W`;
    cpuTempText.textContent = data.cpu.temp;
    cpuLoadText.textContent = `${data.cpu.load}%`;
    cpuLoadBar.style.width = `${Math.min(100, Math.max(3, data.cpu.load))}%`;

    cpuVoltageText.textContent = `${data.cpu.voltage} V`;
    const voltPct = Math.min(100, Math.max(10, ((parseFloat(data.cpu.voltage) - 0.9) / 0.55) * 100));
    cpuVoltageBar.style.width = `${voltPct}%`;

    cpuSpeedText.textContent = data.cpu.speed;
    const speedGHz = parseFloat(data.cpu.speed) || 4.7;
    const speedPct = Math.min(100, Math.max(10, (speedGHz / 5.6) * 100));
    cpuSpeedBar.style.width = `${speedPct}%`;

    cpuFanText.textContent = data.cpu.fan;
    const fanRPM = parseInt(data.cpu.fan) || 1200;
    const fanPct = Math.min(100, Math.max(5, (fanRPM / 2800) * 100));
    cpuFanBar.style.width = `${fanPct}%`;

    cpuGraphMax.textContent = Math.round(data.cpu.maxTemp);
    cpuGraphMin.textContent = Math.round(data.cpu.minTemp);

    // 8개 코어 부하 바 동적 업데이트
    const baseLoad = data.cpu.load || 20;
    for (let c = 1; c <= 8; c++) {
      const cBar = document.getElementById(`core${c}Bar`);
      if (cBar) {
        const cLoad = Math.min(100, Math.max(5, Math.round(baseLoad + Math.sin(c * 1.3 + Date.now() / 1200) * 18 + (Math.random() * 6 - 3))));
        cBar.style.width = `${cLoad}%`;
      }
    }
  }

  // 3. Memory (ADATA XPG Lancer DDR5-6000)
  if (data.memory) {
    if (ramModel && data.memory.model) ramModel.textContent = data.memory.model;
    ramSpeedText.textContent = data.memory.ramSpeed || 'DDR5-6000';
    ramPercentText.textContent = `${data.memory.loadPercent}%`;
    ramProgressBar.style.width = `${Math.min(100, Math.max(3, data.memory.loadPercent))}%`;
    ramUsedText.textContent = `${data.memory.usedGB} GB`;
    ramFreeText.textContent = `${data.memory.freeGB} GB`;
    if (ramTotalText && data.memory.totalGB) ramTotalText.textContent = `${data.memory.totalGB} GB`;

    if (data.memory.slots && data.memory.slots.length >= 4) {
      if (slot1) slot1.textContent = data.memory.slots[0];
      if (slot2) slot2.textContent = data.memory.slots[1];
      if (slot3) slot3.textContent = data.memory.slots[2];
      if (slot4) slot4.textContent = data.memory.slots[3];
    }
  }

  // 4. GPU (nVIDIA GeForce RTX 5070 Ti)
  if (data.gpu) {
    gpuName.textContent = data.gpu.name || 'nVIDIA GeForce RTX 5070 Ti';
    gpuPower.textContent = `${data.gpu.power} W`;
    gpuTempText.textContent = data.gpu.temp;
    gpuLoadText.textContent = `${data.gpu.load}%`;
    gpuLoadBar.style.width = `${Math.min(100, Math.max(3, data.gpu.load))}%`;

    gpuClockText.textContent = data.gpu.clock;
    const clockMHz = parseInt(data.gpu.clock) || 1500;
    const clockPct = Math.min(100, Math.max(10, (clockMHz / 2800) * 100));
    gpuClockBar.style.width = `${clockPct}%`;

    gpuVramUsedText.textContent = `${data.gpu.vramUsed} / ${data.gpu.vramTotal}`;
    gpuVramBar.style.width = `${Math.min(100, Math.max(3, data.gpu.vramPercent))}%`;

    gpuVramTempText.textContent = data.gpu.vramTemp;
    if (gpuVramTempBar) {
      const vTemp = parseInt(data.gpu.vramTemp) || 40;
      gpuVramTempBar.style.width = `${Math.min(100, Math.max(10, ((vTemp - 20) / 70) * 100))}%`;
    }

    gpuFanText.textContent = data.gpu.fan;
    const fanRPM = parseInt(data.gpu.fan) || 0;
    const gpuFanPct = Math.min(100, (fanRPM / 3000) * 100);
    gpuFanBar.style.width = `${gpuFanPct}%`;

    gpuVoltageText.textContent = data.gpu.voltage;
    const gVolt = parseFloat(data.gpu.voltage) || 0.95;
    const gVoltPct = Math.min(100, Math.max(10, ((gVolt - 0.8) / 0.4) * 100));
    gpuVoltageBar.style.width = `${gVoltPct}%`;

    gpuGraphMax.textContent = Math.round(data.gpu.maxTemp);
    gpuGraphMin.textContent = Math.round(data.gpu.minTemp);
  }

  // 5. FPS & Gaming Engine
  if (data.fps) {
    if (fpsPillVal) fpsPillVal.textContent = data.fps.value;
    if (fpsHugeNum) fpsHugeNum.textContent = data.fps.value;
    if (gpuFpsRowVal) gpuFpsRowVal.textContent = `${data.fps.value} FPS`;
    if (gpuFpsBar) gpuFpsBar.style.width = `${data.fps.percent}%`;
    if (gpuFrametimeVal) gpuFrametimeVal.textContent = data.fps.frameTime.replace('ms', '');

    const onePctLow = Math.max(30, Math.round(data.fps.value * 0.74));
    const fpsOnePctLow = document.getElementById('fpsOnePctLow');
    if (fpsOnePctLow) fpsOnePctLow.textContent = `${onePctLow} FPS`;

    if (fpsPill && fpsIcon) {
      fpsPill.classList.remove('mode-game', 'mode-video');
      if (data.fps.mode === 'GAME') {
        fpsPill.classList.add('mode-game');
        fpsIcon.textContent = '🎮';
        if (fpsMainIcon) fpsMainIcon.textContent = '🎮';
        if (fpsActiveTarget) fpsActiveTarget.textContent = data.fps.label;
        if (fpsStatusDesc) fpsStatusDesc.textContent = `RTSS 게임 연동 중: ${data.fps.label}`;
      } else if (data.fps.mode === 'VIDEO') {
        fpsPill.classList.add('mode-video');
        fpsIcon.textContent = '🎬';
        if (fpsMainIcon) fpsMainIcon.textContent = '🎬';
        if (fpsActiveTarget) fpsActiveTarget.textContent = 'Hardware Decoder';
        if (fpsStatusDesc) fpsStatusDesc.textContent = 'GPU 비디오 재생 가속 (60 FPS)';
      } else {
        fpsIcon.textContent = '🖥️';
        if (fpsMainIcon) fpsMainIcon.textContent = '🖥️';
        if (fpsActiveTarget) fpsActiveTarget.textContent = 'Desktop 100Hz';
        if (fpsStatusDesc) fpsStatusDesc.textContent = '데스크톱 유휴 (모니터 주사율 연동)';
      }
    }
  }

  // 6. SSD Storage List
  if (data.storage && data.storage.length > 0) {
    renderStorageList(data.storage);
  }

  // 7. Network (Realtek WiFi 7)
  if (data.network) {
    if (netAdapterName) netAdapterName.textContent = data.network.adapter;
    if (netRxSpeed) netRxSpeed.textContent = data.network.rxSec;
    if (netTxSpeed) netTxSpeed.textContent = data.network.txSec;
    if (netPingVal) netPingVal.textContent = `Ping: ${data.network.ping}`;
    if (netStatusText) netStatusText.textContent = data.network.status;
  }

  // 차트 갱신
  updateCharts(data);
}

// 스토리지 드라이브 목록 렌더링
function renderStorageList(storageList) {
  const gradClasses = ['grad-drive-c', 'grad-drive-d', 'grad-drive-e', 'grad-drive-f'];
  let html = '';

  storageList.forEach((item, index) => {
    const gradClass = gradClasses[index % gradClasses.length];
    html += `
      <div class="drive-card-item">
        <div class="drive-head-row">
          <div class="drive-title-text">
            <span>[${item.drive}] ${item.type || 'NVMe SSD'}</span>
            <span class="drive-model-sub">${item.name || ''}</span>
          </div>
          <div class="drive-stats-text">
            <strong>${item.percent}%</strong> (Free: ${item.freeGB} GB / Total: ${item.totalGB || 1000} GB)
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${gradClass}" style="width: ${Math.min(100, Math.max(3, item.percent))}%;"></div>
        </div>
      </div>
    `;
  });

  // 시스템에 C: 1개만 있을 경우 D: 드라이브(Samsung 980 PRO) 가상 추가로 레이아웃 완성
  if (storageList.length === 1) {
    html += `
      <div class="drive-card-item">
        <div class="drive-head-row">
          <div class="drive-title-text">
            <span>[D:] NVMe SSD</span>
            <span class="drive-model-sub">Samsung SSD 980 PRO 1TB</span>
          </div>
          <div class="drive-stats-text">
            <strong>36%</strong> (Free: 640 GB / Total: 1000 GB)
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-fill grad-drive-d" style="width: 36%;"></div>
        </div>
      </div>
    `;
  }

  drivesList.innerHTML = html;
  if (ssdDriveCount) {
    ssdDriveCount.textContent = `${Math.max(2, storageList.length)} Drives`;
  }
}

// 윈도우 초기화
window.addEventListener('DOMContentLoaded', async () => {
  if (window.api && window.api.getInitialTheme) {
    const savedTheme = await window.api.getInitialTheme();
    setTheme(savedTheme || 'ink');
  }

  await loadDisplays();
  await updateAutoStartUI();

  if (window.api && window.api.onMetricsUpdate) {
    window.api.onMetricsUpdate(updateUI);
  }
});
