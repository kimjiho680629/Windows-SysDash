Add-Type @"
using System;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Text;

public class RtssReader {
    [StructLayout(LayoutKind.Sequential)]
    public struct RTSS_SHARED_MEMORY {
        public uint dwSignature;
        public uint dwVersion;
        public uint dwAppEntrySize;
        public uint dwAppArrOffset;
        public uint dwAppArrSize;
        public uint dwOSDEntrySize;
        public uint dwOSDArrOffset;
        public uint dwOSDArrSize;
    }

    public static string GetFpsInfo() {
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

                        // dwFrames, dwTime0, dwTime1, or dwStatFramerateAvg
                        // AppEntry offsets:
                        // 0: dwProcessId (4)
                        // 4: szName (260)
                        // 264: dwFlags (4)
                        // 268: dwTime0 (4)
                        // 272: dwTime1 (4)
                        // 276: dwFrames (4)
                        // 280: dwFrameTime (4)
                        // 284: dwStatFlags (4)
                        // 288: dwStatTime0 (4)
                        // 292: dwStatTime1 (4)
                        // 296: dwStatFrames (4)
                        // 300: dwStatCount (4)
                        // 304: dwStatFramerateMin (4)
                        // 308: dwStatFramerateAvg (4)
                        // 312: dwStatFramerateMax (4)

                        uint time0 = accessor.ReadUInt32(entryPos + 268);
                        uint time1 = accessor.ReadUInt32(entryPos + 272);
                        uint frames = accessor.ReadUInt32(entryPos + 276);
                        uint frameTime = accessor.ReadUInt32(entryPos + 280);
                        uint fpsAvg = accessor.ReadUInt32(entryPos + 308);

                        // 실시간 framerate 계산: 1000 * frames / (time1 - time0)
                        double instantFps = 0;
                        if (time1 > time0 && frames > 0) {
                            instantFps = (double)frames * 1000.0 / (time1 - time0);
                        } else if (frameTime > 0) {
                            instantFps = 1000000.0 / frameTime;
                        }

                        return string.Format("{0}|{1:F0}|{2}|{3}", name, instantFps > 0 ? instantFps : (fpsAvg / 10.0), pid, frameTime);
                    }
                }
            }
        } catch (Exception ex) {
            return "ERROR:" + ex.Message;
        }
        return "IDLE|0|0|0";
    }
}
"@

$info = [RtssReader]::GetFpsInfo()
Write-Host "Result: $info"
