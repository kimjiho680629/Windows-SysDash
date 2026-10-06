$dest = "C:\Gemini_job\SysDash\release\SysDash"
if (Test-Path $dest) {
    Remove-Item -Recurse -Force $dest
}
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host "Copying Electron binaries..."
Copy-Item -Recurse -Force "node_modules\electron\dist\*" $dest
Rename-Item "$dest\electron.exe" "SysDash.exe"

$defaultAsar = Join-Path $dest "resources\default_app.asar"
if (Test-Path $defaultAsar) {
    Remove-Item -Force $defaultAsar
}

$appDir = Join-Path $dest "resources\app"
New-Item -ItemType Directory -Force -Path $appDir | Out-Null

Write-Host "Copying application code..."
Copy-Item -Force "package.json" $appDir
Copy-Item -Recurse -Force "src" (Join-Path $appDir "src")
Copy-Item -Recurse -Force "bin" (Join-Path $appDir "bin")

$appNm = Join-Path $appDir "node_modules"
New-Item -ItemType Directory -Force -Path $appNm | Out-Null

Write-Host "Copying dependencies..."
Copy-Item -Recurse -Force "node_modules\systeminformation" (Join-Path $appNm "systeminformation")

Write-Host "SUCCESS: Standalone package created at $dest\SysDash.exe"
