using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

class Program {
    [STAThread]
    static void Main() {
        try {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            string standalonePath = Path.Combine(baseDir, @"release\SysDash\SysDash.exe");

            if (File.Exists(standalonePath)) {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = standalonePath;
                psi.WorkingDirectory = Path.GetDirectoryName(standalonePath);
                psi.UseShellExecute = true;
                Process.Start(psi);
                return;
            }

            string electronPath = Path.Combine(baseDir, @"node_modules\electron\dist\electron.exe");
            if (File.Exists(electronPath)) {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = electronPath;
                psi.Arguments = ".";
                psi.WorkingDirectory = baseDir;
                psi.UseShellExecute = true;
                Process.Start(psi);
                return;
            }

            MessageBox.Show("실행 파일을 찾을 수 없습니다.", "SysDash 오류", MessageBoxButtons.OK, MessageBoxIcon.Error);
        } catch (Exception ex) {
            MessageBox.Show("SysDash 실행 실패:\n" + ex.Message, "SysDash 오류", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
