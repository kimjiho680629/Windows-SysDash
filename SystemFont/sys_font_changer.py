# -*- coding: utf-8 -*-
"""
Windows 11 시스템 폰트 체인저 (Python GUI 버전)
- tkinter 기반 모던 UI
- 원클릭 시스템 폰트 변경 & 기본값 복원
- 실시간 레지스트리 백업 (.reg)
"""

import os
import sys
import ctypes
import winreg
import subprocess
import datetime
import tkinter as tk
from tkinter import ttk, messagebox

RECOMMENDED_FONT_EN = "KoPubWorldDotum_Pro"
RECOMMENDED_FONT_KR = "KoPubWorld돋움체_Pro"

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False

def run_as_admin():
    if not is_admin():
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, " ".join(f'"{arg}"' for arg in sys.argv), None, 1
        )
        sys.exit()

class SysFontChangerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Windows 11 시스템 폰트 체인저 Pro (Python GUI)")
        self.root.geometry("820x780")
        self.root.configure(bg="#181825")

        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.backup_dir = os.path.join(self.base_dir, "FontBackups")
        os.makedirs(self.backup_dir, exist_ok=True)

        self.setup_ui()
        self.load_status()

    def setup_ui(self):
        style = ttk.Style()
        style.theme_use("clam")

        # 헤더
        header_frame = tk.Frame(self.root, bg="#181825")
        header_frame.pack(fill="x", padx=16, pady=(14, 8))
        tk.Label(
            header_frame, text="⚡ Windows 11 시스템 폰트 체인저",
            font=("Malgun Gothic", 16, "bold"), fg="#CDD6F4", bg="#181825"
        ).pack(side="left")
        tk.Label(
            header_frame, text="v1.0 Pro  |  원클릭 안전 변경 & 복원 도구",
            font=("Malgun Gothic", 10), fg="#A6ADC8", bg="#181825"
        ).pack(side="left", padx=12, pady=4)

        # 1. 상태 카드
        status_card = tk.LabelFrame(
            self.root, text=" 📌 현재 시스템 상태 ",
            font=("Malgun Gothic", 10, "bold"), fg="#89B4FA", bg="#1E1E2E", bd=1, relief="solid"
        )
        status_card.pack(fill="x", padx=16, pady=6)

        self.lbl_admin = tk.Label(status_card, font=("Malgun Gothic", 9, "bold"), bg="#1E1E2E")
        self.lbl_admin.pack(anchor="w", padx=12, pady=(4, 2))
        if is_admin():
            self.lbl_admin.config(text="🛡️ 관리자 권한 활성화됨 (시스템 레지스트리 수정 가능)", fg="#A6E3A1")
        else:
            self.lbl_admin.config(text="⚠️ 관리자 권한 없음 (수정 시 UAC 권한 요청 필요)", fg="#F38BA8")

        self.lbl_segoe = tk.Label(status_card, text="현재 Segoe UI: 조회 중...", font=("Malgun Gothic", 10), fg="#FFFFFF", bg="#1E1E2E")
        self.lbl_segoe.pack(anchor="w", padx=12, pady=2)

        self.lbl_wm = tk.Label(status_card, text="현재 WindowMetrics: 조회 중...", font=("Malgun Gothic", 10), fg="#FFFFFF", bg="#1E1E2E")
        self.lbl_wm.pack(anchor="w", padx=12, pady=(2, 6))

        # 크롬 폰트 즉시 선택 버튼
        btn_chrome = tk.Button(
            status_card, text="⭐ 크롬 폰트(KoPubWorld 돋움 Pro) 원클릭 선택",
            font=("Malgun Gothic", 10, "bold"), bg="#10B981", fg="#FFFFFF",
            relief="flat", cursor="hand2", padx=10, pady=4,
            command=self.select_chrome_font
        )
        btn_chrome.pack(anchor="e", padx=12, pady=(0, 8))

        # 2. 폰트 선택 & 프리셋 카드
        font_card = tk.LabelFrame(
            self.root, text=" 🎨 적용할 시스템 폰트 선택 ",
            font=("Malgun Gothic", 10, "bold"), fg="#89B4FA", bg="#1E1E2E", bd=1, relief="solid"
        )
        font_card.pack(fill="x", padx=16, pady=6)

        f_select_box = tk.Frame(font_card, bg="#1E1E2E")
        f_select_box.pack(fill="x", padx=12, pady=6)

        import tkinter.font as tkfont
        fonts = sorted(list(set(tkfont.families())))
        self.combo_font = ttk.Combobox(f_select_box, values=[RECOMMENDED_FONT_KR, RECOMMENDED_FONT_EN] + fonts, font=("Malgun Gothic", 10))
        self.combo_font.set(RECOMMENDED_FONT_KR)
        self.combo_font.pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.combo_font.bind("<<ComboboxSelected>>", lambda e: self.update_preview())

        self.entry_custom = tk.Entry(f_select_box, font=("Malgun Gothic", 10), width=24)
        self.entry_custom.insert(0, RECOMMENDED_FONT_KR)
        self.entry_custom.pack(side="right")
        self.entry_custom.bind("<KeyRelease>", lambda e: self.update_preview())

        # 프리셋 버튼들
        preset_frame = tk.Frame(font_card, bg="#1E1E2E")
        preset_frame.pack(fill="x", padx=12, pady=(0, 8))
        presets = [
            ("KoPubWorld 돋움 Pro", RECOMMENDED_FONT_KR),
            ("맑은 고딕 (기본)", "맑은 고딕"),
            ("Pretendard", "Pretendard"),
            ("D2Coding", "D2Coding"),
            ("나눔고딕", "NanumGothic")
        ]
        for name, target in presets:
            btn = tk.Button(
                preset_frame, text=name, font=("Malgun Gothic", 9),
                bg="#313244", fg="#FFFFFF", relief="flat", cursor="hand2", padx=8, pady=2,
                command=lambda t=target: self.set_target_font(t)
            )
            btn.pack(side="left", padx=4)

        # 3. 실시간 미리보기
        preview_card = tk.LabelFrame(
            self.root, text=" 👁️ 실시간 글꼴 미리보기 ",
            font=("Malgun Gothic", 10, "bold"), fg="#A6E3A1", bg="#1E1E2E", bd=1, relief="solid"
        )
        preview_card.pack(fill="x", padx=16, pady=6)

        ctrl_frame = tk.Frame(preview_card, bg="#1E1E2E")
        ctrl_frame.pack(fill="x", padx=12, pady=4)

        self.var_bold = tk.BooleanVar(value=False)
        chk_bold = tk.Checkbutton(
            ctrl_frame, text="굵게 (Bold)", variable=self.var_bold,
            font=("Malgun Gothic", 9), fg="#FFFFFF", bg="#1E1E2E", selectcolor="#313244",
            activebackground="#1E1E2E", activeforeground="#FFFFFF",
            command=self.update_preview
        )
        chk_bold.pack(side="right", padx=6)

        self.scale_size = tk.Scale(
            ctrl_frame, from_=10, to=30, orient="horizontal",
            bg="#1E1E2E", fg="#FFFFFF", highlightthickness=0,
            command=lambda v: self.update_preview()
        )
        self.scale_size.set(15)
        self.scale_size.pack(side="right", padx=6)

        tk.Label(ctrl_frame, text="크기 조절:", font=("Malgun Gothic", 9), fg="#CDD6F4", bg="#1E1E2E").pack(side="right")

        self.txt_preview = tk.Text(
            preview_card, height=4, font=(RECOMMENDED_FONT_KR, 15),
            bg="#11111B", fg="#CDD6F4", relief="flat", padx=10, pady=8, bd=0
        )
        self.txt_preview.insert("1.0", "다람쥐 헌 쳇바퀴에 타고파. 동해 물과 백두산이 마르고 닳도록!\nABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz\n1234567890 !@#$%^&*() (가독성을 직접 확인해보세요)")
        self.txt_preview.pack(fill="x", padx=12, pady=(0, 8))

        # 4. 세부 옵션
        opt_card = tk.LabelFrame(
            self.root, text=" ⚙️ 적용 세부 옵션 ",
            font=("Malgun Gothic", 10, "bold"), fg="#F9E2AF", bg="#1E1E2E", bd=1, relief="solid"
        )
        opt_card.pack(fill="x", padx=16, pady=6)

        self.opt_segoe = tk.BooleanVar(value=True)
        self.opt_malgun = tk.BooleanVar(value=True)
        self.opt_wm = tk.BooleanVar(value=True)
        self.opt_promote = tk.BooleanVar(value=True)
        self.opt_explorer = tk.BooleanVar(value=True)
        self.opt_backup = tk.BooleanVar(value=True)

        opt_grid = tk.Frame(opt_card, bg="#1E1E2E")
        opt_grid.pack(fill="x", padx=12, pady=6)

        def make_chk(parent, text, var, col, row):
            cb = tk.Checkbutton(
                parent, text=text, variable=var,
                font=("Malgun Gothic", 9), fg="#FFFFFF", bg="#1E1E2E", selectcolor="#313244",
                activebackground="#1E1E2E", activeforeground="#FFFFFF"
            )
            cb.grid(column=col, row=row, sticky="w", padx=6, pady=2)

        make_chk(opt_grid, "전체 시스템 Segoe UI 대체", self.opt_segoe, 0, 0)
        make_chk(opt_grid, "맑은 고딕(Malgun Gothic) 동시 대체", self.opt_malgun, 1, 0)
        make_chk(opt_grid, "창/메뉴/대화상자 UI 폰트 즉시 변경", self.opt_wm, 0, 1)
        make_chk(opt_grid, "미등록 글꼴 자동 시스템 승격", self.opt_promote, 1, 1)
        make_chk(opt_grid, "적용 후 파일 탐색기 즉시 재시작", self.opt_explorer, 0, 2)
        make_chk(opt_grid, "적용 전 자동 레지스트리 백업 생성", self.opt_backup, 1, 2)

        # 5. 실행 버튼
        btn_box = tk.Frame(self.root, bg="#181825")
        btn_box.pack(fill="x", padx=16, pady=8)

        btn_apply = tk.Button(
            btn_box, text="🚀 시스템 폰트 변경 적용 (원클릭)",
            font=("Malgun Gothic", 12, "bold"), bg="#3B82F6", fg="#FFFFFF",
            relief="flat", cursor="hand2", height=2,
            command=self.apply_font
        )
        btn_apply.pack(side="left", fill="x", expand=True, padx=(0, 6))

        btn_restore = tk.Button(
            btn_box, text="🔄 Windows 11 기본값 복원",
            font=("Malgun Gothic", 11, "bold"), bg="#E11D48", fg="#FFFFFF",
            relief="flat", cursor="hand2", height=2,
            command=self.restore_defaults
        )
        btn_restore.pack(side="left", padx=6)

        btn_backup_dir = tk.Button(
            btn_box, text="📂 백업 폴더 열기",
            font=("Malgun Gothic", 10), bg="#313244", fg="#FFFFFF",
            relief="flat", cursor="hand2", height=2,
            command=self.open_backups
        )
        btn_backup_dir.pack(side="left", padx=(6, 0))

        # 6. 로그
        self.txt_log = tk.Text(
            self.root, height=5, font=("Consolas", 9),
            bg="#11111B", fg="#A6E3A1", relief="flat", padx=8, pady=6
        )
        self.txt_log.pack(fill="both", expand=True, padx=16, pady=(0, 14))

    def log(self, msg):
        now = datetime.datetime.now().strftime("%H:%M:%S")
        self.txt_log.insert("end", f"[{now}] {msg}\n")
        self.txt_log.see("end")

    def select_chrome_font(self):
        self.set_target_font(RECOMMENDED_FONT_KR)

    def set_target_font(self, font_name):
        self.combo_font.set(font_name)
        self.entry_custom.delete(0, tk.END)
        self.entry_custom.insert(0, font_name)
        self.update_preview()

    def update_preview(self):
        target = self.entry_custom.get().strip()
        size = self.scale_size.get()
        weight = "bold" if self.var_bold.get() else "normal"
        try:
            self.txt_preview.config(font=(target, size, weight))
        except Exception:
            pass

    def load_status(self):
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes", 0, winreg.KEY_READ) as k:
                seg, _ = winreg.QueryValueEx(k, "Segoe UI")
                self.lbl_segoe.config(text=f"현재 Segoe UI 치환: {seg}")
        except Exception:
            self.lbl_segoe.config(text="현재 Segoe UI 치환: 없음 (기본값)")

        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Control Panel\Desktop\WindowMetrics", 0, winreg.KEY_READ) as k:
                val, _ = winreg.QueryValueEx(k, "MessageFont")
                name = val[28:92].decode("utf-16le", errors="ignore").rstrip("\x00")
                self.lbl_wm.config(text=f"현재 WindowMetrics 폰트: {name}")
        except Exception:
            pass

    def create_backup(self):
        try:
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            path = os.path.join(self.backup_dir, f"backup_{ts}.reg")
            lines = [
                "Windows Registry Editor Version 5.00\n",
                r"[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts]" + "\n"
            ]
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts", 0, winreg.KEY_READ) as k:
                i = 0
                while True:
                    try:
                        n, v, _ = winreg.EnumValue(k, i)
                        if "Segoe UI" in n:
                            lines.append(f'"{n}"="{v}"\n')
                        i += 1
                    except OSError:
                        break

            lines.append("\n" + r"[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes]" + "\n")
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes", 0, winreg.KEY_READ) as k:
                i = 0
                while True:
                    try:
                        n, v, _ = winreg.EnumValue(k, i)
                        if any(x in n for x in ["Segoe UI", "Malgun", "맑은"]):
                            lines.append(f'"{n}"="{v}"\n')
                        i += 1
                    except OSError:
                        break

            with open(path, "w", encoding="utf-16") as f:
                f.writelines(lines)
            self.log(f"안전 백업 완료: {os.path.basename(path)}")
            return path
        except Exception as e:
            self.log(f"백업 실패: {e}")
            return None

    def promote_font(self, font_name):
        try:
            win_fonts = os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts")
            user_fonts = os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Microsoft\Windows\Fonts")
            if not os.path.isdir(user_fonts):
                return
            for fname in os.listdir(user_fonts):
                if "KoPub" in fname or font_name in fname:
                    src = os.path.join(user_fonts, fname)
                    dst = os.path.join(win_fonts, fname)
                    if not os.path.exists(dst):
                        import shutil
                        shutil.copy2(src, dst)
                        self.log(f"시스템 폰트 폴더로 복사: {fname}")
                    with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts", 0, winreg.KEY_WRITE) as k:
                        rname = os.path.splitext(fname)[0] + " (TrueType)"
                        try:
                            winreg.SetValueEx(k, rname, 0, winreg.REG_SZ, fname)
                        except Exception:
                            pass
        except Exception as e:
            self.log(f"폰트 승격 예외: {e}")

    def apply_window_metrics(self, font_name):
        keys = ["CaptionFont", "SmCaptionFont", "MenuFont", "StatusFont", "MessageFont", "IconFont"]
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Control Panel\Desktop\WindowMetrics", 0, winreg.KEY_ALL_ACCESS) as k:
                name_bytes = font_name.encode("utf-16le")
                for item in keys:
                    data, _ = winreg.QueryValueEx(k, item)
                    b = bytearray(data)
                    b[28:92] = b'\x00' * 64
                    b[28:28+len(name_bytes)] = name_bytes
                    winreg.SetValueEx(k, item, 0, winreg.REG_BINARY, bytes(b))
            self.log("WindowMetrics 6종 UI 폰트 갱신 완료")
        except Exception as e:
            self.log(f"WindowMetrics 수정 오류: {e}")

    def apply_font(self):
        if not is_admin():
            messagebox.showwarning("권한 필요", "시스템 레지스트리를 수정하려면 관리자 권한으로 실행해야 합니다.\n프로그램을 관리자 권한으로 다시 실행합니다.")
            run_as_admin()
            return

        target = self.entry_custom.get().strip()
        if not target:
            messagebox.showwarning("입력 필요", "적용할 폰트를 선택하세요.")
            return

        if not messagebox.askyesno("확인", f"시스템 폰트를 '{target}'(으)로 변경하시겠습니까?\n\n※ 적용 전 자동 백업이 생성됩니다."):
            return

        self.log(f"시스템 폰트 적용 시작: {target}")
        if self.opt_backup.get():
            self.create_backup()

        if self.opt_promote.get():
            self.promote_font(target)

        if self.opt_segoe.get():
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts", 0, winreg.KEY_WRITE) as k:
                for s in ["Segoe UI", "Segoe UI Bold", "Segoe UI Bold Italic", "Segoe UI Italic", "Segoe UI Light", "Segoe UI Semibold"]:
                    winreg.SetValueEx(k, f"{s} (TrueType)", 0, winreg.REG_SZ, "")
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes", 0, winreg.KEY_WRITE) as k:
                winreg.SetValueEx(k, "Segoe UI", 0, winreg.REG_SZ, target)
                if self.opt_malgun.get():
                    winreg.SetValueEx(k, "Malgun Gothic", 0, winreg.REG_SZ, target)
                    winreg.SetValueEx(k, "맑은 고딕", 0, winreg.REG_SZ, target)

        if self.opt_wm.get():
            self.apply_window_metrics(target)

        ctypes.windll.user32.SendMessageTimeoutW(0xFFFF, 0x001A, 0, "WindowMetrics", 2, 2000, None)
        ctypes.windll.user32.SendMessageTimeoutW(0xFFFF, 0x001A, 0, "FontSubstitutes", 2, 2000, None)

        if self.opt_explorer.get():
            subprocess.run(["taskkill", "/f", "/im", "explorer.exe"], capture_output=True)
            subprocess.Popen(["explorer.exe"])
            self.log("탐색기 재시작 완료")

        self.load_status()
        self.log(f"🎉 '{target}' 폰트 적용이 완료되었습니다!")
        messagebox.showinfo("완료", f"'{target}' 폰트가 시스템에 성공적으로 적용되었습니다!")

    def restore_defaults(self):
        if not is_admin():
            messagebox.showwarning("권한 필요", "관리자 권한이 필요합니다.")
            run_as_admin()
            return

        if not messagebox.askyesno("복원 확인", "Windows 11 기본 폰트(Segoe UI 및 맑은 고딕)로 복원하시겠습니까?"):
            return

        self.log("기본값 복원 시작...")
        self.create_backup()

        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts", 0, winreg.KEY_WRITE) as k:
            winreg.SetValueEx(k, "Segoe UI (TrueType)", 0, winreg.REG_SZ, "segoeui.ttf")
            winreg.SetValueEx(k, "Segoe UI Bold (TrueType)", 0, winreg.REG_SZ, "segoeuib.ttf")
            winreg.SetValueEx(k, "Segoe UI Bold Italic (TrueType)", 0, winreg.REG_SZ, "segoeuiiz.ttf")
            winreg.SetValueEx(k, "Segoe UI Italic (TrueType)", 0, winreg.REG_SZ, "segoeuii.ttf")
            winreg.SetValueEx(k, "Segoe UI Light (TrueType)", 0, winreg.REG_SZ, "segoeuil.ttf")
            winreg.SetValueEx(k, "Segoe UI Semibold (TrueType)", 0, winreg.REG_SZ, "seguisb.ttf")

        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\FontSubstitutes", 0, winreg.KEY_WRITE) as k:
            for item in ["Segoe UI", "Malgun Gothic", "맑은 고딕"]:
                try:
                    winreg.DeleteValue(k, item)
                except OSError:
                    pass

        self.apply_window_metrics("맑은 고딕")
        ctypes.windll.user32.SendMessageTimeoutW(0xFFFF, 0x001A, 0, "WindowMetrics", 2, 2000, None)
        ctypes.windll.user32.SendMessageTimeoutW(0xFFFF, 0x001A, 0, "FontSubstitutes", 2, 2000, None)

        subprocess.run(["taskkill", "/f", "/im", "explorer.exe"], capture_output=True)
        subprocess.Popen(["explorer.exe"])

        self.load_status()
        self.log("🎉 Windows 11 기본 폰트로 복원 완료되었습니다.")
        messagebox.showinfo("복원 완료", "기본 폰트로 복원되었습니다.")

    def open_backups(self):
        os.startfile(self.backup_dir)

if __name__ == "__main__":
    root = tk.Tk()
    app = SysFontChangerApp(root)
    root.mainloop()
