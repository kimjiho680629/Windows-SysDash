# ==============================================================================
# SysDash WinVer - System Specs & Environment Detection Script
# Usage: powershell -ExecutionPolicy Bypass -File scratch/detect_system_specs.ps1
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       SysDash WinVer - System Spec & Display Detection   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. OS & Device Info
Write-Host "[1] OS & Device Info" -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
$cs = Get-CimInstance Win32_ComputerSystem
Write-Host ("  - Hostname (PC Name): {0} ({1})" -f $cs.DNSHostName, $cs.Name)
Write-Host ("  - OS: {0} ({1}, {2})" -f $os.Caption, $os.Version, $os.OSArchitecture)
Write-Host ("  - Manufacturer / Model: {0} / {1}" -f $cs.Manufacturer, $cs.Model)
Write-Host ""

# 2. Displays / Monitors
Write-Host "[2] Connected Displays (Monitors)" -ForegroundColor Yellow
Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens
for ($i = 0; $i -lt $screens.Count; $i++) {
    $scr = $screens[$i]
    $isPri = if ($scr.Primary) { "[Primary Monitor]" } else { "" }
    Write-Host ("  * Monitor {0} {1}:" -f ($i + 1), $isPri) -ForegroundColor Green
    Write-Host ("      - Device: {0}" -f $scr.DeviceName)
    Write-Host ("      - Resolution: {0} x {1}" -f $scr.Bounds.Width, $scr.Bounds.Height)
    Write-Host ("      - Coordinates: X={0}, Y={1}" -f $scr.Bounds.X, $scr.Bounds.Y)
    Write-Host ("      - Working Area: {0} x {1}" -f $scr.WorkingArea.Width, $scr.WorkingArea.Height)
}
Write-Host "  (Tip: Target monitor bounds.x, width, height for src/main.js)" -ForegroundColor DarkGray
Write-Host ""

# 3. CPU Info
Write-Host "[3] Processor (CPU) Info" -ForegroundColor Yellow
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
Write-Host ("  - CPU Model: {0}" -f $cpu.Name)
Write-Host ("  - Cores / Threads: {0} Cores / {1} Threads" -f $cpu.NumberOfCores, $cpu.NumberOfLogicalProcessors)
Write-Host ("  - Base Clock: {0} GHz" -f [math]::Round($cpu.MaxClockSpeed / 1000, 2))
Write-Host ""

# 4. GPU Info
Write-Host "[4] Graphics Card (GPU) Info" -ForegroundColor Yellow
$gpus = Get-CimInstance Win32_VideoController
foreach ($gpu in $gpus) {
    $vramGb = if ($gpu.AdapterRAM) { [math]::Round($gpu.AdapterRAM / 1GB, 1) } else { "N/A" }
    Write-Host ("  - GPU Model: {0}" -f $gpu.Name)
    Write-Host ("      - VRAM: {0} GB" -f $vramGb)
    Write-Host ("      - Driver Version: {0}" -f $gpu.DriverVersion)
}
try {
    $nvsmi = nvidia-smi --query-gpu=gpu_name,memory.total,driver_version --format=csv,noheader 2>$null
    if ($nvsmi) {
        Write-Host ("  - NVIDIA-SMI Detected: {0}" -f $nvsmi) -ForegroundColor Green
    }
} catch {}
Write-Host ""

# 5. Memory Info
Write-Host "[5] Memory (RAM) Info" -ForegroundColor Yellow
$totalRamGb = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1)
$dimms = Get-CimInstance Win32_PhysicalMemory
Write-Host ("  - Total RAM: {0} GB" -f $totalRamGb)
Write-Host ("  - Populated Slots: {0}" -f $dimms.Count)
$slot = 1
foreach ($dimm in $dimms) {
    $capGb = [math]::Round($dimm.Capacity / 1GB, 0)
    Write-Host ("    - Slot #{0}: {1} GB ({2}) | Rated: {3} MHz | Configured: {4} MHz (Bank: {5})" -f $slot, $capGb, $dimm.Manufacturer, $dimm.Speed, $dimm.ConfiguredClockSpeed, $dimm.DeviceLocator)
    $slot++
}
Write-Host ""

# 6. Storage Info
Write-Host "[6] Storage (SSD / HDD) Info" -ForegroundColor Yellow
$disks = Get-CimInstance Win32_DiskDrive
foreach ($disk in $disks) {
    $diskGb = [math]::Round($disk.Size / 1GB, 1)
    Write-Host ("  - Model: {0} ({1} GB, {2})" -f $disk.Model, $diskGb, $disk.MediaType)
}
$vols = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
foreach ($vol in $vols) {
    $sizeGb = [math]::Round($vol.Size / 1GB, 1)
    $freeGb = [math]::Round($vol.FreeSpace / 1GB, 1)
    $usedPct = [math]::Round((($vol.Size - $vol.FreeSpace) / $vol.Size) * 100, 1)
    Write-Host ("    - Volume {0}: Total {1} GB / Free {2} GB (Used {3}%)" -f $vol.DeviceID, $sizeGb, $freeGb, $usedPct)
}
Write-Host ""

# 7. Network Info
Write-Host "[7] Network Adapter Info" -ForegroundColor Yellow
$activeNets = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
foreach ($net in $activeNets) {
    Write-Host ("  - Interface: {0}" -f $net.Name)
    Write-Host ("      - Description: {0}" -f $net.InterfaceDescription)
    Write-Host ("      - Link Speed: {0}" -f $net.LinkSpeed)
}
Write-Host ""

# 8. SysDash Customization Guide
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "           SysDash File Customization Quick Guide         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "1. Target Monitor Settings (src/main.js):"
Write-Host "   - Update findMonitor3() with your target bounds.x, width, and height."
Write-Host "2. Hardware Spec Sensor Defaults (src/collector.js):"
Write-Host "   - Update this.cpuStatic.brand, this.ramSpeed, etc."
Write-Host "3. UI Title & Spec Labels (src/renderer/index.html):"
Write-Host "   - CPU: id=`"cpuName`", AM5 / LGA socket, Cores/Threads"
Write-Host "   - GPU: id=`"gpuName`", VRAM size"
Write-Host "   - RAM: id=`"ramSpec`", Total GB"
Write-Host "   - Disks: Drive model names"
Write-Host "4. Hardware Photos (src/renderer/assets/hardware/):"
Write-Host "   - Replace cpu.jpg, gpu.jpg, ram.jpg, ssd.jpg, net.jpg with photos of your parts"
Write-Host "==========================================================" -ForegroundColor Cyan
