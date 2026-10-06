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

    public static void Main(string[] args) {
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

                // 활성 게임 또는 가장 최근 렌더링된 프로세스 찾기
                double highestFps = 0;
                string activeProc = "";
                uint activeFrameTime = 0;

                for (int i = 0; i < maxEntries; i++) {
                    long entryPos = offset + (i * entrySize);
                    uint pid = accessor.ReadUInt32(entryPos);
                    if (pid != 0) {
                        byte[] nameBytes = new byte[260];
                        accessor.ReadArray(entryPos + 4, nameBytes, 0, 260);
                        string fullPath = Encoding.Default.GetString(nameBytes).Split('\0')[0];
                        string procName = Path.GetFileName(fullPath);

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

                        if (instantFps <= 0 && fpsAvg > 0) {
                            instantFps = fpsAvg / 10.0;
                        }

                        if (instantFps > highestFps) {
                            highestFps = instantFps;
                            activeProc = procName;
                            activeFrameTime = frameTime;
                        }
                    }
                }

                if (highestFps > 0) {
                    Console.WriteLine("{{\"fps\": {0:F0}, \"process\": \"{1}\", \"frameTimeUs\": {2}, \"source\": \"RTSS\"}}",
                        highestFps, activeProc, activeFrameTime);
                    return;
                }
            }
        } catch {
            // RTSS가 켜져 있지 않거나 오류 시
        }

        Console.WriteLine("{\"fps\": 0, \"process\": \"\", \"frameTimeUs\": 0, \"source\": \"none\"}");
    }
}
