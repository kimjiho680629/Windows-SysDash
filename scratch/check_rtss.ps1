try {
    $mmf = [System.IO.MemoryMappedFiles.MemoryMappedFile]::OpenExisting("RTSSSharedMemoryV2")
    Write-Host "RTSSSharedMemoryV2 Found!"
    $stream = $mmf.CreateViewStream()
    $reader = New-Object System.IO.BinaryReader($stream)
    $sig = [System.Text.Encoding]::ASCII.GetString($reader.ReadBytes(4))
    $ver = $reader.ReadUInt32()
    $appEntrySize = $reader.ReadUInt32()
    $appArrOffset = $reader.ReadUInt32()
    $appArrSize = $reader.ReadUInt32()
    Write-Host "Signature: $sig, Version: 0x$($ver.ToString('X8')), AppEntries: $appArrSize"

    for ($i = 0; $i -lt $appArrSize; $i++) {
        $stream.Position = $appArrOffset + ($i * $appEntrySize)
        $pid = $reader.ReadUInt32()
        if ($pid -ne 0) {
            $bytes = $reader.ReadBytes(260)
            $name = [System.Text.Encoding]::ASCII.GetString($bytes).Trim([char]0)
            $stream.Position = $appArrOffset + ($i * $appEntrySize) + 4 + 260 + 4
            $framerate = $reader.ReadUInt32()
            $frames = $reader.ReadUInt32()
            $frametime = $reader.ReadUInt32()
            Write-Host "PID: $pid, Name: $name, Framerate: $framerate, Frames: $frames, Frametime: $frametime"
        }
    }

    $stream.Dispose()
    $mmf.Dispose()
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
