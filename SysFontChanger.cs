using System;
using System.IO;
using System.Text;
using System.Diagnostics;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Documents;
using System.Runtime.InteropServices;
using System.Security.Principal;
using Microsoft.Win32;

namespace SysFontChanger
{
    public class Program
    {
        [STAThread]
        public static void Main()
        {
            try
            {
                var app = new Application();
                var mainWindow = new MainWindow();
                app.Run(mainWindow);
            }
            catch (Exception ex)
            {
                MessageBox.Show("오류가 발생했습니다: " + ex.Message + "\n" + ex.StackTrace, "오류", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    public class MainWindow : Window
    {
        // Win32 API 선언
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern IntPtr SendMessageTimeout(
            IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam,
            uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);

        private static readonly IntPtr HWND_BROADCAST = new IntPtr(0xffff);
        private const uint WM_SETTINGCHANGE = 0x001A;
        private const uint SMTO_ABORTIFHUNG = 0x0002;

        // UI 컨트롤
        private ComboBox comboFonts;
        private TextBox txtCustomFont;
        private Slider sliderFontSize;
        private TextBlock lblFontSize;
        private CheckBox chkBold;
        private TextBox txtPreview;
        private CheckBox chkSegoeUI;
        private CheckBox chkMalgunGothic;
        private CheckBox chkWindowMetrics;
        private CheckBox chkAutoPromoteFont;
        private CheckBox chkRestartExplorer;
        private CheckBox chkCreateBackup;
        private TextBox txtLog;
        private TextBlock lblCurrentSegoe;
        private TextBlock lblCurrentWM;
        private TextBlock lblAdminStatus;

        private const string RECOMMENDED_FONT = "KoPubWorldDotum_Pro";
        private const string RECOMMENDED_FONT_KR = "KoPubWorld돋움체_Pro";
        private string backupDir = "";

        public MainWindow()
        {
            this.Title = "Windows 11 시스템 폰트 체인저 Pro (SysFont Changer Pro)";
            this.Width = 840;
            this.Height = 820;
            this.WindowStartupLocation = WindowStartupLocation.CenterScreen;
            this.Background = new SolidColorBrush(Color.FromRgb(24, 24, 37)); // Dark #181825

            // 실행 경로 기반 백업 디렉토리
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            backupDir = Path.Combine(baseDir, "FontBackups");

            BuildUI();
            CheckAdminStatus();
            LoadCurrentStatus();
            PopulateFontList();
        }

        private void BuildUI()
        {
            var mainGrid = new Grid();
            mainGrid.Margin = new Thickness(16);
            mainGrid.RowDefinitions.Add(new RowDefinition() { Height = GridLength.Auto }); // 0: 헤더
            mainGrid.RowDefinitions.Add(new RowDefinition() { Height = GridLength.Auto }); // 1: 현재 상태 카드
            mainGrid.RowDefinitions.Add(new RowDefinition() { Height = GridLength.Auto }); // 2: 폰트 선택 카드
            mainGrid.RowDefinitions.Add(new RowDefinition() { Height = new GridLength(180) }); // 3: 실시간 미리보기
            mainGrid.RowDefinitions.Add(new RowDefinition() { Height = GridLength.Auto }); // 4: 옵션 카드
            mainGrid.RowDefinitions.Add(new RowDefinition() { Height = GridLength.Auto }); // 5: 액션 버튼들
            mainGrid.RowDefinitions.Add(new RowDefinition() { Height = new GridLength(100) }); // 6: 로그창

            // --- 0. 헤더 ---
            var headerPanel = new DockPanel() { Margin = new Thickness(0, 0, 0, 12) };
            var titleBlock = new TextBlock()
            {
                Text = "⚡ Windows 11 시스템 폰트 체인저",
                FontSize = 20,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(205, 214, 244))
            };
            var subtitleBlock = new TextBlock()
            {
                Text = "v1.0 Pro  |  원클릭 안전 변경 & 복원 도구",
                FontSize = 12,
                Foreground = new SolidColorBrush(Color.FromRgb(166, 173, 200)),
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(12, 6, 0, 0)
            };
            DockPanel.SetDock(titleBlock, Dock.Left);
            headerPanel.Children.Add(titleBlock);
            headerPanel.Children.Add(subtitleBlock);
            Grid.SetRow(headerPanel, 0);
            mainGrid.Children.Add(headerPanel);

            // --- 1. 현재 상태 카드 ---
            var statusBorder = CreateCardBorder();
            var statusGrid = new Grid();
            statusGrid.ColumnDefinitions.Add(new ColumnDefinition() { Width = new GridLength(1, GridUnitType.Star) });
            statusGrid.ColumnDefinitions.Add(new ColumnDefinition() { Width = GridLength.Auto });

            var statusStack = new StackPanel();
            lblAdminStatus = new TextBlock() { FontSize = 12, Margin = new Thickness(0, 0, 0, 4) };
            lblCurrentSegoe = new TextBlock() { Text = "현재 Segoe UI 치환: 확인 중...", FontSize = 13, Foreground = Brushes.White, Margin = new Thickness(0, 0, 0, 2) };
            lblCurrentWM = new TextBlock() { Text = "현재 WindowMetrics 폰트: 확인 중...", FontSize = 13, Foreground = Brushes.White };
            statusStack.Children.Add(lblAdminStatus);
            statusStack.Children.Add(lblCurrentSegoe);
            statusStack.Children.Add(lblCurrentWM);
            Grid.SetColumn(statusStack, 0);
            statusGrid.Children.Add(statusStack);

            var btnChromeSelect = new Button()
            {
                Content = "⭐ 크롬 폰트(KoPubWorld 돋움 Pro) 즉시 선택",
                Background = new SolidColorBrush(Color.FromRgb(16, 185, 129)),
                Foreground = Brushes.White,
                FontWeight = FontWeights.Bold,
                Padding = new Thickness(14, 8, 14, 8),
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand,
                VerticalAlignment = VerticalAlignment.Center
            };
            btnChromeSelect.Click += (s, e) => SelectChromeFont();
            Grid.SetColumn(btnChromeSelect, 1);
            statusGrid.Children.Add(btnChromeSelect);

            statusBorder.Child = statusGrid;
            Grid.SetRow(statusBorder, 1);
            mainGrid.Children.Add(statusBorder);

            // --- 2. 폰트 선택 & 검색 카드 ---
            var selectBorder = CreateCardBorder();
            var selectStack = new StackPanel();

            var selectHeader = new TextBlock()
            {
                Text = "🎨 적용할 시스템 폰트 선택",
                FontSize = 14,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(137, 180, 250)),
                Margin = new Thickness(0, 0, 0, 8)
            };
            selectStack.Children.Add(selectHeader);

            var fontRow = new Grid();
            fontRow.ColumnDefinitions.Add(new ColumnDefinition() { Width = new GridLength(1, GridUnitType.Star) });
            fontRow.ColumnDefinitions.Add(new ColumnDefinition() { Width = new GridLength(180) });

            comboFonts = new ComboBox()
            {
                Height = 32,
                Margin = new Thickness(0, 0, 8, 0),
                FontSize = 13
            };
            comboFonts.SelectionChanged += (s, e) => OnFontSelectionChanged();
            Grid.SetColumn(comboFonts, 0);
            fontRow.Children.Add(comboFonts);

            txtCustomFont = new TextBox()
            {
                Height = 32,
                FontSize = 13,
                VerticalContentAlignment = VerticalAlignment.Center,
                ToolTip = "직접 폰트 이름을 입력할 수도 있습니다."
            };
            txtCustomFont.TextChanged += (s, e) => UpdatePreview();
            Grid.SetColumn(txtCustomFont, 1);
            fontRow.Children.Add(txtCustomFont);

            selectStack.Children.Add(fontRow);

            // 추천 프리셋 버튼 패널
            var presetPanel = new WrapPanel() { Margin = new Thickness(0, 8, 0, 0) };
            presetPanel.Children.Add(CreatePresetButton("KoPubWorld 돋움 Pro", RECOMMENDED_FONT_KR));
            presetPanel.Children.Add(CreatePresetButton("맑은 고딕 (기본)", "맑은 고딕"));
            presetPanel.Children.Add(CreatePresetButton("Pretendard", "Pretendard"));
            presetPanel.Children.Add(CreatePresetButton("D2Coding", "D2Coding"));
            presetPanel.Children.Add(CreatePresetButton("나눔고딕", "NanumGothic"));
            selectStack.Children.Add(presetPanel);

            selectBorder.Child = selectStack;
            Grid.SetRow(selectBorder, 2);
            mainGrid.Children.Add(selectBorder);

            // --- 3. 실시간 미리보기 ---
            var previewBorder = CreateCardBorder();
            var previewGrid = new Grid();
            previewGrid.RowDefinitions.Add(new RowDefinition() { Height = GridLength.Auto });
            previewGrid.RowDefinitions.Add(new RowDefinition() { Height = new GridLength(1, GridUnitType.Star) });

            var previewCtrlRow = new DockPanel() { Margin = new Thickness(0, 0, 0, 6) };
            var previewTitle = new TextBlock()
            {
                Text = "👁️ 실시간 글꼴 미리보기 (아래 텍스트를 직접 수정해보세요)",
                FontSize = 13,
                FontWeight = FontWeights.SemiBold,
                Foreground = new SolidColorBrush(Color.FromRgb(166, 227, 161))
            };
            DockPanel.SetDock(previewTitle, Dock.Left);
            previewCtrlRow.Children.Add(previewTitle);

            chkBold = new CheckBox()
            {
                Content = "굵게 (Bold)",
                Foreground = Brushes.White,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(12, 0, 0, 0)
            };
            chkBold.Checked += (s, e) => UpdatePreview();
            chkBold.Unchecked += (s, e) => UpdatePreview();
            DockPanel.SetDock(chkBold, Dock.Right);
            previewCtrlRow.Children.Add(chkBold);

            sliderFontSize = new Slider()
            {
                Minimum = 11,
                Maximum = 32,
                Value = 15,
                Width = 100,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(8, 0, 0, 0)
            };
            sliderFontSize.ValueChanged += (s, e) => UpdatePreview();
            DockPanel.SetDock(sliderFontSize, Dock.Right);
            previewCtrlRow.Children.Add(sliderFontSize);

            lblFontSize = new TextBlock()
            {
                Text = "크기: 15pt",
                Foreground = Brushes.White,
                FontSize = 12,
                VerticalAlignment = VerticalAlignment.Center
            };
            DockPanel.SetDock(lblFontSize, Dock.Right);
            previewCtrlRow.Children.Add(lblFontSize);

            Grid.SetRow(previewCtrlRow, 0);
            previewGrid.Children.Add(previewCtrlRow);

            txtPreview = new TextBox()
            {
                Text = "다람쥐 헌 쳇바퀴에 타고파. 동해 물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세!\r\nThe quick brown fox jumps over the lazy dog. 1234567890 !@#$%^&*()",
                TextWrapping = TextWrapping.Wrap,
                AcceptsReturn = true,
                Background = new SolidColorBrush(Color.FromRgb(30, 30, 46)),
                Foreground = Brushes.White,
                BorderBrush = new SolidColorBrush(Color.FromRgb(69, 71, 90)),
                Padding = new Thickness(8),
                FontSize = 15
            };
            Grid.SetRow(txtPreview, 1);
            previewGrid.Children.Add(txtPreview);

            previewBorder.Child = previewGrid;
            Grid.SetRow(previewBorder, 3);
            mainGrid.Children.Add(previewBorder);

            // --- 4. 옵션 카드 ---
            var optBorder = CreateCardBorder();
            var optStack = new StackPanel();

            var optHeader = new TextBlock()
            {
                Text = "⚙️ 적용 세부 옵션",
                FontSize = 13,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(249, 226, 175)),
                Margin = new Thickness(0, 0, 0, 6)
            };
            optStack.Children.Add(optHeader);

            var optWrap = new WrapPanel();
            chkSegoeUI = CreateCheckBox("전체 시스템 Segoe UI 대체 (FontSubstitutes)", true);
            chkMalgunGothic = CreateCheckBox("맑은 고딕(Malgun Gothic) 동시 대체", true);
            chkWindowMetrics = CreateCheckBox("창/메뉴/대화상자 UI 폰트 즉시 변경 (WindowMetrics)", true);
            chkAutoPromoteFont = CreateCheckBox("미등록 글꼴 자동 시스템(C:\\Windows\\Fonts) 승격", true);
            chkRestartExplorer = CreateCheckBox("적용 후 파일 탐색기(Explorer) 즉시 재시작", true);
            chkCreateBackup = CreateCheckBox("적용 전 자동 레지스트리 백업 생성 (.reg)", true);

            optWrap.Children.Add(chkSegoeUI);
            optWrap.Children.Add(chkMalgunGothic);
            optWrap.Children.Add(chkWindowMetrics);
            optWrap.Children.Add(chkAutoPromoteFont);
            optWrap.Children.Add(chkRestartExplorer);
            optWrap.Children.Add(chkCreateBackup);

            optStack.Children.Add(optWrap);
            optBorder.Child = optStack;
            Grid.SetRow(optBorder, 4);
            mainGrid.Children.Add(optBorder);

            // --- 5. 액션 버튼들 ---
            var btnGrid = new Grid() { Margin = new Thickness(0, 8, 0, 8) };
            btnGrid.ColumnDefinitions.Add(new ColumnDefinition() { Width = new GridLength(2, GridUnitType.Star) });
            btnGrid.ColumnDefinitions.Add(new ColumnDefinition() { Width = new GridLength(1.3, GridUnitType.Star) });
            btnGrid.ColumnDefinitions.Add(new ColumnDefinition() { Width = new GridLength(1, GridUnitType.Star) });

            var btnApply = new Button()
            {
                Content = "🚀 시스템 폰트 변경 적용 (원클릭)",
                Background = new SolidColorBrush(Color.FromRgb(59, 130, 246)),
                Foreground = Brushes.White,
                FontWeight = FontWeights.Bold,
                FontSize = 14,
                Height = 44,
                Margin = new Thickness(0, 0, 8, 0),
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btnApply.Click += (s, e) => ApplyFontChanges();
            Grid.SetColumn(btnApply, 0);
            btnGrid.Children.Add(btnApply);

            var btnRestore = new Button()
            {
                Content = "🔄 Windows 11 기본값 복원",
                Background = new SolidColorBrush(Color.FromRgb(225, 29, 72)),
                Foreground = Brushes.White,
                FontWeight = FontWeights.Bold,
                FontSize = 13,
                Height = 44,
                Margin = new Thickness(0, 0, 8, 0),
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btnRestore.Click += (s, e) => RestoreDefaultSettings();
            Grid.SetColumn(btnRestore, 1);
            btnGrid.Children.Add(btnRestore);

            var btnOpenBackups = new Button()
            {
                Content = "📂 백업 폴더 열기",
                Background = new SolidColorBrush(Color.FromRgb(49, 50, 68)),
                Foreground = Brushes.White,
                FontWeight = FontWeights.SemiBold,
                FontSize = 12,
                Height = 44,
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btnOpenBackups.Click += (s, e) => OpenBackupFolder();
            Grid.SetColumn(btnOpenBackups, 2);
            btnGrid.Children.Add(btnOpenBackups);

            Grid.SetRow(btnGrid, 5);
            mainGrid.Children.Add(btnGrid);

            // --- 6. 로그창 ---
            txtLog = new TextBox()
            {
                IsReadOnly = true,
                Background = new SolidColorBrush(Color.FromRgb(17, 17, 27)),
                Foreground = new SolidColorBrush(Color.FromRgb(166, 227, 161)),
                FontFamily = new FontFamily("Consolas, Malgun Gothic"),
                FontSize = 12,
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Padding = new Thickness(6),
                BorderBrush = new SolidColorBrush(Color.FromRgb(49, 50, 68))
            };
            Grid.SetRow(txtLog, 6);
            mainGrid.Children.Add(txtLog);

            this.Content = mainGrid;
        }

        private Border CreateCardBorder()
        {
            return new Border()
            {
                Background = new SolidColorBrush(Color.FromRgb(30, 30, 46)),
                BorderBrush = new SolidColorBrush(Color.FromRgb(49, 50, 68)),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(12),
                Margin = new Thickness(0, 0, 0, 8)
            };
        }

        private Button CreatePresetButton(string text, string fontTarget)
        {
            var btn = new Button()
            {
                Content = text,
                Background = new SolidColorBrush(Color.FromRgb(49, 50, 68)),
                Foreground = Brushes.White,
                FontSize = 12,
                Padding = new Thickness(10, 4, 10, 4),
                Margin = new Thickness(0, 0, 6, 4),
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btn.Click += (s, e) =>
            {
                txtCustomFont.Text = fontTarget;
                SelectComboFontByName(fontTarget);
            };
            return btn;
        }

        private CheckBox CreateCheckBox(string text, bool isChecked)
        {
            return new CheckBox()
            {
                Content = text,
                IsChecked = isChecked,
                Foreground = Brushes.White,
                FontSize = 12,
                Margin = new Thickness(0, 3, 16, 3),
                VerticalAlignment = VerticalAlignment.Center
            };
        }

        private void CheckAdminStatus()
        {
            bool isAdmin = false;
            try
            {
                var identity = WindowsIdentity.GetCurrent();
                var principal = new WindowsPrincipal(identity);
                isAdmin = principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch { }

            if (isAdmin)
            {
                lblAdminStatus.Text = "🛡️ 관리자 권한 활성화됨 (시스템 레지스트리 수정 가능)";
                lblAdminStatus.Foreground = new SolidColorBrush(Color.FromRgb(166, 227, 161)); // Green
            }
            else
            {
                lblAdminStatus.Text = "⚠️ 관리자 권한 필요 (시스템 폰트 적용 시 관리자 권한으로 실행해야 합니다)";
                lblAdminStatus.Foreground = new SolidColorBrush(Color.FromRgb(243, 139, 168)); // Red
            }
        }

        private void LoadCurrentStatus()
        {
            try
            {
                using (var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes"))
                {
                    if (key != null)
                    {
                        var seg = key.GetValue("Segoe UI");
                        lblCurrentSegoe.Text = "현재 Segoe UI 치환: " + (seg != null ? seg.ToString() : "없음 (기본값)");
                    }
                }

                using (var key = Registry.CurrentUser.OpenSubKey(@"Control Panel\Desktop\WindowMetrics"))
                {
                    if (key != null)
                    {
                        byte[] msgBytes = key.GetValue("MessageFont") as byte[];
                        if (msgBytes != null && msgBytes.Length >= 92)
                        {
                            string fontName = Encoding.Unicode.GetString(msgBytes, 28, 64).Trim('\0');
                            lblCurrentWM.Text = "현재 WindowMetrics 폰트: " + fontName;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log("상태 조회 중 오류: " + ex.Message);
            }
        }

        private void PopulateFontList()
        {
            var fontNames = new List<string>();
            foreach (var family in Fonts.SystemFontFamilies)
            {
                foreach (var kv in family.FamilyNames)
                {
                    if (!fontNames.Contains(kv.Value))
                    {
                        fontNames.Add(kv.Value);
                    }
                }
            }
            fontNames.Sort();

            comboFonts.Items.Clear();

            // 추천 폰트 상단 배치
            comboFonts.Items.Add(RECOMMENDED_FONT_KR + " (Chrome 감지 글꼴)");
            comboFonts.Items.Add(RECOMMENDED_FONT);

            foreach (var fn in fontNames)
            {
                if (fn != RECOMMENDED_FONT && fn != RECOMMENDED_FONT_KR)
                {
                    comboFonts.Items.Add(fn);
                }
            }

            // 기본 선택: Chrome 감지 폰트
            SelectChromeFont();
        }

        private void SelectChromeFont()
        {
            txtCustomFont.Text = RECOMMENDED_FONT_KR;
            SelectComboFontByName(RECOMMENDED_FONT_KR);
        }

        private void SelectComboFontByName(string fontName)
        {
            for (int i = 0; i < comboFonts.Items.Count; i++)
            {
                string item = comboFonts.Items[i].ToString();
                if (item.StartsWith(fontName, StringComparison.OrdinalIgnoreCase))
                {
                    comboFonts.SelectedIndex = i;
                    return;
                }
            }
        }

        private void OnFontSelectionChanged()
        {
            if (comboFonts.SelectedItem != null)
            {
                string sel = comboFonts.SelectedItem.ToString();
                int idx = sel.IndexOf(" (");
                if (idx > 0) sel = sel.Substring(0, idx);
                txtCustomFont.Text = sel;
            }
        }

        private void UpdatePreview()
        {
            if (txtPreview == null || txtCustomFont == null) return;

            string targetFont = txtCustomFont.Text.Trim();
            if (string.IsNullOrEmpty(targetFont)) return;

            try
            {
                txtPreview.FontFamily = new FontFamily(targetFont);
                txtPreview.FontSize = sliderFontSize.Value;
                txtPreview.FontWeight = (chkBold.IsChecked == true) ? FontWeights.Bold : FontWeights.Normal;
                lblFontSize.Text = string.Format("크기: {0:0}pt", sliderFontSize.Value);
            }
            catch { }
        }

        private void Log(string message)
        {
            string timeStr = DateTime.Now.ToString("HH:mm:ss");
            txtLog.AppendText(string.Format("[{0}] {1}\r\n", timeStr, message));
            txtLog.ScrollToEnd();
        }

        // --- 백업 로직 ---
        private string CreateRegistryBackup()
        {
            try
            {
                if (!Directory.Exists(backupDir))
                {
                    Directory.CreateDirectory(backupDir);
                }

                string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                string regFilePath = Path.Combine(backupDir, string.Format("backup_{0}.reg", timestamp));

                var sb = new StringBuilder();
                sb.AppendLine("Windows Registry Editor Version 5.00");
                sb.AppendLine();
                sb.AppendLine("[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts]");

                using (var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts"))
                {
                    if (key != null)
                    {
                        foreach (var name in key.GetValueNames())
                        {
                            if (name.IndexOf("Segoe UI", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                string val = key.GetValue(name) != null ? key.GetValue(name).ToString() : "";
                                sb.AppendLine(string.Format("\"{0}\"=\"{1}\"", name.Replace("\"", "\\\""), val.Replace("\\", "\\\\")));
                            }
                        }
                    }
                }

                sb.AppendLine();
                sb.AppendLine("[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\FontSubstitutes]");
                using (var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes"))
                {
                    if (key != null)
                    {
                        foreach (var name in key.GetValueNames())
                        {
                            if (name.IndexOf("Segoe UI", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                name.IndexOf("Malgun", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                name.IndexOf("맑은", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                string val = key.GetValue(name) != null ? key.GetValue(name).ToString() : "";
                                sb.AppendLine(string.Format("\"{0}\"=\"{1}\"", name.Replace("\"", "\\\""), val.Replace("\\", "\\\\")));
                            }
                        }
                    }
                }

                File.WriteAllText(regFilePath, sb.ToString(), Encoding.Unicode);
                Log("안전 백업 생성 완료: " + Path.GetFileName(regFilePath));
                return regFilePath;
            }
            catch (Exception ex)
            {
                Log("백업 생성 실패: " + ex.Message);
                return null;
            }
        }

        // --- 폰트 시스템 승격 (HKCU -> HKLM / C:\Windows\Fonts) ---
        private void PromoteFontToSystem(string fontFaceName)
        {
            try
            {
                string winFontsDir = Environment.GetFolderPath(Environment.SpecialFolder.Fonts);
                string userFontsDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Windows\Fonts");

                if (!Directory.Exists(userFontsDir)) return;

                // 해당 폰트 관련 파일 검색
                var userFiles = Directory.GetFiles(userFontsDir, "*.*");
                foreach (var file in userFiles)
                {
                    string fileName = Path.GetFileName(file);
                    if (fileName.IndexOf("KoPub", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        fileName.IndexOf(fontFaceName, StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        string destPath = Path.Combine(winFontsDir, fileName);
                        if (!File.Exists(destPath))
                        {
                            try
                            {
                                File.Copy(file, destPath, true);
                                Log("시스템 글꼴 폴더로 복사됨: " + fileName);
                            }
                            catch { }
                        }

                        // HKLM Fonts 등록
                        using (var hklmKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts", true))
                        {
                            if (hklmKey != null)
                            {
                                string regName = Path.GetFileNameWithoutExtension(fileName) + " (TrueType)";
                                if (hklmKey.GetValue(regName) == null)
                                {
                                    hklmKey.SetValue(regName, fileName);
                                    Log("HKLM 글꼴 레지스트리 등록: " + regName);
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log("폰트 시스템 승격 중 예외 (무시 가능): " + ex.Message);
            }
        }

        // --- 폰트 변경 실행 ---
        private void ApplyFontChanges()
        {
            string targetFont = txtCustomFont.Text.Trim();
            if (string.IsNullOrEmpty(targetFont))
            {
                MessageBox.Show("적용할 폰트 이름을 선택하거나 입력하세요.", "알림", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var confirm = MessageBox.Show(
                string.Format("시스템 폰트를 '{0}'(으)로 변경하시겠습니까?\r\n\r\n※ 변경 전 현재 레지스트리가 자동으로 백업됩니다.", targetFont),
                "시스템 폰트 변경 확인",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (confirm != MessageBoxResult.Yes) return;

            Log("=========================================");
            Log("시스템 폰트 적용 시작: " + targetFont);

            try
            {
                // 1. 자동 백업
                if (chkCreateBackup.IsChecked == true)
                {
                    CreateRegistryBackup();
                }

                // 2. 글꼴 시스템 승격
                if (chkAutoPromoteFont.IsChecked == true)
                {
                    Log("폰트 파일 시스템 등록 여부 확인 중...");
                    PromoteFontToSystem(targetFont);
                }

                // 3. FontSubstitutes & Fonts 레지스트리 수정
                if (chkSegoeUI.IsChecked == true)
                {
                    Log("Segoe UI 시스템 폰트 치환 작업 진행 중...");
                    using (var fontsKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts", true))
                    {
                        if (fontsKey != null)
                        {
                            // Segoe UI 텍스트 패밀리 더미화 (아이콘 폰트는 절대 건드리지 않음)
                            fontsKey.SetValue("Segoe UI (TrueType)", "");
                            fontsKey.SetValue("Segoe UI Bold (TrueType)", "");
                            fontsKey.SetValue("Segoe UI Bold Italic (TrueType)", "");
                            fontsKey.SetValue("Segoe UI Italic (TrueType)", "");
                            fontsKey.SetValue("Segoe UI Light (TrueType)", "");
                            fontsKey.SetValue("Segoe UI Semibold (TrueType)", "");
                            Log("HKLM Segoe UI 텍스트 키 더미화 완료 (시스템 아이콘 보존)");
                        }
                    }

                    using (var subKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes", true))
                    {
                        if (subKey != null)
                        {
                            subKey.SetValue("Segoe UI", targetFont);
                            Log(string.Format("FontSubstitutes 설정 완료: Segoe UI -> {0}", targetFont));

                            if (chkMalgunGothic.IsChecked == true)
                            {
                                subKey.SetValue("Malgun Gothic", targetFont);
                                subKey.SetValue("맑은 고딕", targetFont);
                                Log(string.Format("FontSubstitutes 설정 완료: Malgun Gothic -> {0}", targetFont));
                            }
                        }
                    }
                }

                // 4. WindowMetrics 수정
                if (chkWindowMetrics.IsChecked == true)
                {
                    Log("창/메뉴/대화상자 UI 메트릭스(WindowMetrics) 갱신 중...");
                    ApplyWindowMetricsFont(targetFont);
                }

                // 5. 시스템 브로드캐스트 알림
                UIntPtr result;
                SendMessageTimeout(HWND_BROADCAST, WM_SETTINGCHANGE, UIntPtr.Zero, "WindowMetrics", SMTO_ABORTIFHUNG, 2000, out result);
                SendMessageTimeout(HWND_BROADCAST, WM_SETTINGCHANGE, UIntPtr.Zero, "FontSubstitutes", SMTO_ABORTIFHUNG, 2000, out result);

                // 6. 파일 탐색기 재시작
                if (chkRestartExplorer.IsChecked == true)
                {
                    RestartExplorer();
                }

                LoadCurrentStatus();
                Log("🎉 시스템 폰트 변경이 성공적으로 완료되었습니다!");
                Log("=========================================");

                MessageBox.Show(
                    string.Format("'{0}' 폰트가 성공적으로 시스템에 적용되었습니다!\r\n\r\n일부 전체 화면 앱이나 시작 메뉴의 완전한 적용을 위해\r\n필요 시 로그오프 후 재로그인 또는 재부팅을 권장합니다.", targetFont),
                    "적용 완료",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                Log("적용 중 오류 발생: " + ex.Message);
                MessageBox.Show("적용 중 오류가 발생했습니다: " + ex.Message, "오류", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // --- WindowMetrics 폰트 변경 ---
        private void ApplyWindowMetricsFont(string fontName)
        {
            string[] metricsKeys = new string[] { "CaptionFont", "SmCaptionFont", "MenuFont", "StatusFont", "MessageFont", "IconFont" };

            using (var key = Registry.CurrentUser.OpenSubKey(@"Control Panel\Desktop\WindowMetrics", true))
            {
                if (key == null) return;

                byte[] nameBytes = Encoding.Unicode.GetBytes(fontName);

                foreach (var k in metricsKeys)
                {
                    byte[] fontBytes = key.GetValue(k) as byte[];
                    if (fontBytes != null && fontBytes.Length >= 92)
                    {
                        // 28번 인덱스부터 64바이트 초기화 후 새 폰트 이름 삽입
                        Array.Clear(fontBytes, 28, 64);
                        Array.Copy(nameBytes, 0, fontBytes, 28, Math.Min(nameBytes.Length, 62));
                        key.SetValue(k, fontBytes, RegistryValueKind.Binary);
                    }
                }
                Log("WindowMetrics 6종 UI 폰트 바이트 갱신 완료");
            }
        }

        // --- 윈도우 11 기본값 복원 ---
        private void RestoreDefaultSettings()
        {
            var confirm = MessageBox.Show(
                "시스템 폰트를 Windows 11 기본 상태(Segoe UI 및 맑은 고딕)로 복원하시겠습니까?\r\n\r\n※ 현재 상태도 복원 전 안전하게 백업됩니다.",
                "기본값 복원 확인",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (confirm != MessageBoxResult.Yes) return;

            Log("=========================================");
            Log("Windows 11 기본 폰트 복원 시작...");

            try
            {
                // 1. 현재 상태 백업
                CreateRegistryBackup();

                // 2. Segoe UI 원본 파일명 복원
                using (var fontsKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts", true))
                {
                    if (fontsKey != null)
                    {
                        fontsKey.SetValue("Segoe UI (TrueType)", "segoeui.ttf");
                        fontsKey.SetValue("Segoe UI Bold (TrueType)", "segoeuib.ttf");
                        fontsKey.SetValue("Segoe UI Bold Italic (TrueType)", "segoeuiiz.ttf");
                        fontsKey.SetValue("Segoe UI Italic (TrueType)", "segoeuii.ttf");
                        fontsKey.SetValue("Segoe UI Light (TrueType)", "segoeuil.ttf");
                        fontsKey.SetValue("Segoe UI Semibold (TrueType)", "seguisb.ttf");
                        Log("HKLM Segoe UI 원본 글꼴 매핑 복원 완료");
                    }
                }

                // 3. FontSubstitutes 항목 정리
                using (var subKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes", true))
                {
                    if (subKey != null)
                    {
                        try { subKey.DeleteValue("Segoe UI"); } catch { }
                        try { subKey.DeleteValue("Malgun Gothic"); } catch { }
                        try { subKey.DeleteValue("맑은 고딕"); } catch { }
                        Log("FontSubstitutes 치환 키 삭제 완료");
                    }
                }

                // 4. WindowMetrics 한국어 기본값('맑은 고딕') 복원
                ApplyWindowMetricsFont("맑은 고딕");

                // 5. 브로드캐스트
                UIntPtr result;
                SendMessageTimeout(HWND_BROADCAST, WM_SETTINGCHANGE, UIntPtr.Zero, "WindowMetrics", SMTO_ABORTIFHUNG, 2000, out result);
                SendMessageTimeout(HWND_BROADCAST, WM_SETTINGCHANGE, UIntPtr.Zero, "FontSubstitutes", SMTO_ABORTIFHUNG, 2000, out result);

                // 6. Explorer 재시작
                RestartExplorer();

                LoadCurrentStatus();
                Log("🎉 Windows 11 기본 폰트로 안전하게 복원되었습니다!");
                Log("=========================================");

                MessageBox.Show("Windows 11 기본 폰트로 성공적으로 복원되었습니다!", "복원 완료", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                Log("복원 중 오류 발생: " + ex.Message);
                MessageBox.Show("복원 중 오류가 발생했습니다: " + ex.Message, "오류", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // --- 파일 탐색기 재시작 ---
        private void RestartExplorer()
        {
            try
            {
                Log("파일 탐색기(Explorer) 재시작 중...");
                foreach (var p in Process.GetProcessesByName("explorer"))
                {
                    try { p.Kill(); p.WaitForExit(1000); } catch { }
                }
                Process.Start("explorer.exe");
                Log("파일 탐색기 재시작 완료.");
            }
            catch (Exception ex)
            {
                Log("탐색기 재시작 중 알림: " + ex.Message);
            }
        }

        // --- 백업 폴더 열기 ---
        private void OpenBackupFolder()
        {
            try
            {
                if (!Directory.Exists(backupDir))
                {
                    Directory.CreateDirectory(backupDir);
                }
                Process.Start("explorer.exe", backupDir);
            }
            catch (Exception ex)
            {
                MessageBox.Show("폴더 열기 실패: " + ex.Message);
            }
        }
    }
}
