Add-Type @"
using System;
using System.Runtime.InteropServices;

public class DwmFps {
    [StructLayout(LayoutKind.Sequential)]
    public struct DWM_TIMING_INFO {
        public int cbSize;
        public long rateRefresh_uiNumerator;
        public long rateRefresh_uiDenominator;
        public ulong qpcRefreshPeriod;
        public long rateCompose_uiNumerator;
        public long rateCompose_uiDenominator;
        public ulong qpcVBlank;
        public ulong cRefresh;
        public uint cDXRefresh;
        public ulong qpcCompose;
        public ulong cFrame;
        public uint cDXPresent;
        public ulong cRefreshFrame;
        public ulong cFrameSubmitted;
        public uint cDXPresentSubmitted;
        public ulong cFrameConfirmed;
        public uint cDXPresentConfirmed;
        public ulong cRefreshConfirmed;
        public ulong cRefreshConfirmed2;
        public ulong cFramesLate;
        public ulong cFramesOutstanding;
        public ulong cFrameDisplayed;
        public ulong qpcFrameDisplayed;
        public ulong cRefreshFrameDisplayed;
        public ulong cFrameComplete;
        public ulong qpcFrameComplete;
        public ulong cRefreshFrameComplete;
        public ulong cFramesPending;
        public ulong cFramesAvailable;
        public ulong cFramesDropped;
    }

    [DllImport("dwmapi.dll")]
    public static extern int DwmGetCompositionTimingInfo(IntPtr hwnd, ref DWM_TIMING_INFO timingInfo);

    public static ulong GetFrameCount() {
        DWM_TIMING_INFO info = new DWM_TIMING_INFO();
        info.cbSize = Marshal.SizeOf(typeof(DWM_TIMING_INFO));
        int res = DwmGetCompositionTimingInfo(IntPtr.Zero, ref info);
        return info.cFrameComplete;
    }

    public static double GetRefreshRate() {
        DWM_TIMING_INFO info = new DWM_TIMING_INFO();
        info.cbSize = Marshal.SizeOf(typeof(DWM_TIMING_INFO));
        int res = DwmGetCompositionTimingInfo(IntPtr.Zero, ref info);
        if (info.rateRefresh_uiDenominator > 0) {
            return (double)info.rateRefresh_uiNumerator / info.rateRefresh_uiDenominator;
        }
        return 60.0;
    }
}
"@

$f1 = [DwmFps]::GetFrameCount()
$rate = [DwmFps]::GetRefreshRate()
Start-Sleep -Milliseconds 1000
$f2 = [DwmFps]::GetFrameCount()
$fps = $f2 - $f1
Write-Host "RefreshRate: $rate"
Write-Host "CompletedFrames: $fps"
