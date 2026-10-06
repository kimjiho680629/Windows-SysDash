Add-Type @"
using System;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

public class RtssAllReader {
    [StructLayout(LayoutKind.Sequential)]
    public struct RTSS_SHARED_MEMORY {
        public uint dwSignature;
        public uint dwVersion;
        public uint dwAppEntrySize;
        public uint dwAppArrOffset;
        public uint dwAppArrSize;
    }

    public static string GetAllEntries() {
        var list = new List<string>();
        try {
            using (var mmf = MemoryMappedFile.OpenExisting("RTSSSharedMemoryV2"))
            using (var accessor = mmf.CreateViewAccessor()) {
                byte[] headerBytes = new byte[Marshal.SizeOf(typeof(RTSS_SHARED_MEMORY))];
                accessor.ReadArray(0, headerBytes, 0, headerBytes.Length);

                GCHandle handle = GCHandle.Alloc(headerBytes, GCHandleType.Pinned);
                var header = (RTSS_SHARED_MEMORY)Marshal.PtrToStructure(handle.AddrOfPinnedObject(), typeof(RTSS_SHARED_MEMORY));
                handle.Free();

                int maxEntries = (int)Math.Min(header.dwAppArrSize, 256);
                uint entrySize = header.dwAppEntrySize;
                long offset = header.dwAppArrOffset;

                for (int i = 0; i < maxEntries; i++) {
                    long entryPos = offset + (i * entrySize);
                    uint pid = accessor.ReadUInt32(entryPos);
                    if (pid != 0) {
                        byte[] nameBytes = new byte[260];
                        accessor.ReadArray(entryPos + 4, nameBytes, 0, 260);
                        string name = Encoding.Default.GetString(nameBytes).Split('\0')[0];

                        uint time0 = accessor.ReadUInt32(entryPos + 268);
                        uint time1 = accessor.ReadUInt32(entryPos + 272);
                        uint frames = accessor.ReadUInt32(entryPos + 276);
                        uint frameTime = accessor.ReadUInt32(entryPos + 280);
                        uint fpsAvg = accessor.ReadUInt32(entryPos + 308);

                        double instantFps = 0;
                        if (time1 > time0 && frames > 0) {
                            instantFps = (double)frames * 1000.0 / (time1 - time0);
                        } else if (frameTime > 0) {
                            instantFps = 1000000.0 / frameTime;
                        }

                        list.Add(string.Format("{0}|FPS:{1:F0}|FT:{2}us|PID:{3}", Path.GetFileName(name), instantFps, frameTime, pid));
                    }
                }
            }
        } catch (Exception ex) {
            return "ERROR:" + ex.Message;
        }
        return string.Join(" ; ", list);
    }
}
"@

$res = [RtssAllReader]::GetAllEntries()
Write-Host "Entries: $res"
