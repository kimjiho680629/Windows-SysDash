# 🔤 Windows System Font Changer (시스템 글꼴 변경 도구)

Windows의 기본 시스템 인터페이스 글꼴(Segoe UI, 맑은 고딕, 아이콘, 메뉴, 메시지 상자 등)을 원하는 개발용/커스텀 글꼴(예: **FiraCode Nerd Font**, Pretendard, Cascadia Code 등)로 안전하게 변경하고 관리할 수 있는 전용 유틸리티 도구 모음입니다.

---

## 📁 디렉토리 파일 구성

```text
SystemFont/
├── README.md               # 본 시스템 글꼴 변경 도구 설명 및 사용 가이드
├── SysFontChanger.exe      # C# WPF 기반 관리자 권한 GUI 실행 프로그램
├── SysFontChanger.cs       # C# WPF 전체 소스 코드 (Win32 레지스트리 및 UAC 연동)
├── SysFontChanger.manifest # UAC 관리자 권한(requireAdministrator) 매니페스트
├── sys_font_changer.py     # Python 기반 시스템 글꼴 변경 스크립트
└── FontBackups/            # 글꼴 변경 전 원본 레지스트리 자동 백업 폴더 (로컬 보관)
```

---

## ✨ 주요 기능

1. **원클릭 시스템 폰트 변경**:
   - Windows의 기본 글꼴인 `Segoe UI` 및 `맑은 고딕(Malgun Gothic)`을 사용자가 선택한 글꼴로 시스템 전역 변경.
   - 글꼴 크기(Font Size) 슬라이더 조절 및 볼드(Bold) 스타일 옵션 제공.
2. **안전한 자동 백업 & 복원 (Auto Backup & Restore)**:
   - 글꼴을 변경하기 직전 현재의 Windows 레지스트리 설정(`.reg`)을 `FontBackups/` 폴더에 타임스탬프와 함께 자동 저장.
   - 원클릭 복원 버튼을 통해 언제든지 윈도우 순정 기본 글꼴 상태로 되돌릴 수 있습니다.
3. **탐색기 즉시 재시작 (Restart Explorer)**:
   - 레지스트리 반영 후 `WM_SETTINGCHANGE` 브로드캐스트 및 `explorer.exe`를 자동으로 재시작하여 재부팅 없이 변경 사항을 즉시 적용.
4. **FiraCode Nerd Font 연동**:
   - SysDash 대시보드의 미래지향적 사이버네틱 UI 스타일에 맞춰 시스템 전체 글꼴을 코딩용/너드 폰트로 통일감 있게 세팅 가능.

---

## 🚀 사용 방법

### 1. GUI 프로그램 실행 (가장 추천)
1. **[SysFontChanger.exe](SysFontChanger.exe)**를 마우스 우클릭하여 **'관리자 권한으로 실행'**합니다.
2. 드롭다운 목록에서 원하는 글꼴(예: `FiraCode Nerd Font` 또는 원하는 폰트)을 선택합니다.
3. 필요한 옵션을 체크합니다:
   - `[v] Segoe UI 계열 변경`
   - `[v] 맑은 고딕 계열 변경`
   - `[v] 창 메트릭스(WindowMetrics) 아이콘/메뉴 글꼴 크기 변경`
   - `[v] 변경 전 자동 백업 생성 (권장)`
   - `[v] 파일 탐색기 즉시 재시작`
4. **[글꼴 적용]** 버튼을 클릭하면 수초 내로 시스템 전역 글꼴이 변경됩니다.

### 2. Python 스크립트 실행
파이썬 환경이 구성되어 있을 경우 파이썬으로도 동일하게 실행할 수 있습니다:
```powershell
python SystemFont/sys_font_changer.py
```

---

## 🛠️ C# 소스코드 컴파일 방법 (개발자용)

제공된 `SysFontChanger.cs`와 `SysFontChanger.manifest`를 직접 컴파일하여 바이너리를 생성하려면 Windows에 기본 내장된 .NET 컴파일러를 사용합니다:

```powershell
# .NET Framework 4.0+ 컴파일러 경로
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

# WPF 및 Win32 참조를 포함하여 컴파일
& $csc /target:winexe /win32manifest:SystemFont\SysFontChanger.manifest /out:SystemFont\SysFontChanger.exe /r:PresentationCore.dll /r:PresentationFramework.dll /r:WindowsBase.dll /r:System.Xaml.dll SystemFont\SysFontChanger.cs
```

---

## 🔄 원래 글꼴로 복원하기 (Troubleshooting)

기본 Windows 폰트로 되돌리고 싶을 때는 다음 중 하나를 수행합니다:
1. `SysFontChanger.exe`를 실행하고 **[기본 글꼴로 복원]** 버튼을 클릭합니다.
2. 또는 `SystemFont/FontBackups/` 폴더에 자동 생성된 백업 레지스트리 파일(`.reg`)을 더블 클릭하여 레지스트리에 병합한 후 PC를 재부팅합니다.
