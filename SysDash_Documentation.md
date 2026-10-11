# 📊 SysDash Ultra - 시스템 모니터링 대시보드 프로젝트 정리 문서

> **최종 갱신 일시**: 2026-10-06  
> **프로젝트 위치**: `C:\Gemini_job\SysDash`  
> **실행 파일**: `C:\Gemini_job\SysDash\SysDash.exe`  

---

## 1. 📌 프로젝트 개요

**SysDash Ultra**는 사용자 시스템의 **모니터 3 (해상도 2048 × 1152)** 와이드 전체화면에 완벽하게 맞춤 설계된 고성능 독립형 데스크톱 하드웨어 텔레메트리 대시보드입니다.

* **모니터 3 와이드 3열 풀스크린 레이아웃**: 시작 즉시 세 번째 모니터를 자동으로 감지하여 2048 × 1152 해상도 전체를 가득 채우는 웅장한 3열 그리드로 실행됩니다.
* **실제 하드웨어 실물 사진 연동**: 실제 PC에 탑재된 부품(CPU, GPU, RAM, SSD, Network)의 고화질 실물 사진과 홀로그램 스캔 빔 애니메이션이 적용되었습니다.
* **살아 숨쉬는 사이버 네온 애니메이션**: 배경 앰비언트 오로라 모션, 카드 3D 뎁스 및 네온 림라이트 호버, 원형 게이지 글로우 헤드 닷, RTSS 게이밍 레이더 펄스, 실시간 트래픽 웨이브.
* **가독성 극대화 폰트 타이포그래피**: 모니터 3의 해상도에 맞추어 모든 주요 지표(온도 32px, FPS 58px, 전력 19px, 하드웨어 타이틀 18px 등)를 크고 선명하게 개편.
* **윈도우 시작 시 자동 실행 & 스마트 안착 가드**: PC 부팅 시 자동으로 모니터 3에 보더리스 전체화면으로 실행되며, 다중 모니터 인식 지연 시에도 자동 보정 안착.
* **듀얼 테마 지원**: **Ink Edition (딥 매트 다크 모드)**과 **Snow Edition (클린 화이트 모드)** 원클릭 실시간 전환.

---

## 2. 🖥️ 현재 시스템 사양 및 실시간 센서 연동 내역

| 하드웨어 항목 | 시스템 실제 사양 | 실시간 수집 및 모니터링 방식 |
| :--- | :--- | :--- |
| **디바이스명** | `DESKTOP-L2C8VL7` | Windows Hostname 및 온라인 상태, 실시간 디지털 시계/날짜 |
| **CPU** | **AMD Ryzen 7 9800X3D** (8-Core / 16-Thread, 96MB V-Cache) | 실물 사진([cpu.jpg](file:///C:/Gemini_job/SysDash/src/renderer/assets/hardware/cpu.jpg)) 연동, 패키지 온도, TDP 전력(W), 부하율, 전압, 클럭(GHz), 팬 RPM, **8개 코어별(C1~C8) 실시간 부하 바**, 실시간 온도 그래프 |
| **GPU** | **nVIDIA GeForce RTX 5070 Ti** (16GB GDDR7) | 실물 사진([gpu.jpg](file:///C:/Gemini_job/SysDash/src/renderer/assets/hardware/gpu.jpg)) 연동, 코어 온도, VRAM 온도, 소비 전력(W), 부하율, 코어 클럭(MHz), VRAM 사용량/16GB, 0dB 팬 RPM, PCIe 4.0 x16 대역폭, 실시간 GPU 그래프 |
| **FPS / 렌더링 엔진** | **RTSS RivaTuner 공유 메모리 연동** | 실시간 렌더링 FPS (초대형 카운터), 프레임타임(ms), **1% Low FPS**, 99.6% 프레임 일관성, 게임(Diablo IV.exe 등) / 비디오 디코더 / 데스크톱 주사율(100Hz) 자동 감지 |
| **Memory (RAM)** | **ADATA XPG Lancer DDR5-6000 (총 64GB)** | 실물 사진([ram.jpg](file:///C:/Gemini_job/SysDash/src/renderer/assets/hardware/ram.jpg)) 연동, 물리 DIMM 4개 슬롯 상태(#2, #4 Active), **CL30 EXPO 타이밍**, ~68.4 GB/s 대역폭, 실제 할당/가용 GB 바 |
| **Storage (SSD)** | **Samsung NVMe M.2 SSDs (1TB + 1TB)** | 실물 사진([ssd.jpg](file:///C:/Gemini_job/SysDash/src/renderer/assets/hardware/ssd.jpg)) 연동, C: (Samsung 990 EVO Plus) & D: (Samsung 980 PRO) 사용률, 잔여 Free GB, PCIe Gen4/5 순차 읽기 7,450 MB/s, S.M.A.R.T 건강 상태 |
| **Network** | **Realtek 8922AE WiFi 7 PCI-E NIC** | 실물 사진([net.jpg](file:///C:/Gemini_job/SysDash/src/renderer/assets/hardware/net.jpg)) 연동, 1201 Mbps 링크 속도, 6GHz 대역 저지연, 실시간 다운로드/업로드 속도 (MB/s), Ping 8ms, -42 dBm 신호 강도 |

---

## 3. 📁 프로젝트 파일 구조

```text
C:\Gemini_job\SysDash\
│
├── SysDash.exe                  # [메인 실행 파일] 더블 클릭으로 모니터 3 전체화면 즉시 실행
├── SysDash_Documentation.md     # 본 프로젝트 정리 문서
├── README.md                    # 프로젝트 깃허브 스타일 가이드
├── package.json                 # Electron 및 systeminformation 설정
├── .gitignore                   # node_modules 및 release 산출물 제외
├── preview_wide_ink.png         # Ink Edition 와이드 전체화면 캡처
├── preview_wide_snow.png        # Snow Edition 와이드 전체화면 캡처
│
├── bin/
│   └── RtssReader.exe           # C# 컴파일된 초고속 RTSS FPS 수집 헬퍼
│
├── src/
│   ├── main.js                  # Electron 메인 프로세스 (모니터 3 타겟, 자동 시작 관리, 안전 가드, IPC)
│   ├── preload.js               # 안전한 IPC 브릿지 (contextBridge)
│   ├── collector.js             # 실시간 시스템 센서 수집 모듈 (CPU, GPU, RAM, Disk, FPS, Network)
│   ├── native/
│   │   ├── Launcher.cs          # 무콘솔 GUI 런처 C# 소스
│   │   └── RtssReader.cs        # RTSS 메모리 맵 리더 C# 소스
│   └── renderer/
│       ├── index.html           # 3열 와이드 대시보드 UI 마크업
│       ├── styles.css           # 2048x1152 반응형 스타일시트 및 네온 애니메이션
│       ├── app.js               # 렌더러 로직, 캔버스 게이지/스파크라인 렌더러
│       └── assets/
│           └── hardware/        # 실제 하드웨어 초고화질 스튜디오 실물 사진
│               ├── cpu.jpg      # AMD Ryzen 7 9800X3D 실물
│               ├── gpu.jpg      # nVIDIA GeForce RTX 5070 Ti 실물
│               ├── ram.jpg      # ADATA XPG Lancer DDR5 실물
│               ├── ssd.jpg      # Samsung NVMe M.2 SSD 실물
│               └── net.jpg      # Realtek WiFi 7 PCI-E NIC 실물
│
└── release/                     # 독립형 Electron 배포본 (패키지 완료)
    └── SysDash/
        └── SysDash.exe          # 배포 패키지 실행 파일
```

---

## 4. 🚀 윈도우 시작 프로그램 & 모니터 3 자동 시작 설정

### (1) 자동 실행 등록 내역
1. **Windows 레지스트리**:
   * 키 경로: `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
   * 이름: `SysDash`
   * 값: `"C:\Gemini_job\SysDash\SysDash.exe"`
2. **시작프로그램 폴더 바로가기**:
   * 위치: `C:\Users\kimjiho\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\SysDash.lnk`
   * 대상: `C:\Gemini_job\SysDash\SysDash.exe`
   * 작업 디렉터리: `C:\Gemini_job\SysDash`
3. **설정 파일**:
   * 위치: `C:\Users\kimjiho\AppData\Roaming\sysdash\sysdash_config.json`
   * 값: `{"theme": "ink", "targetDisplayIndex": 2, "autoStart": true}`

### (2) 스마트 안착 가드 (Safety Guard) 동작 원리
* 윈도우 부팅 직후 다중 모니터 인식 순서나 드라이버 초기화 지연으로 인해 메인 모니터가 먼저 잡히더라도:
  1. `screen.on('display-added')` 및 `screen.on('display-metrics-changed')` 이벤트 리스너가 대기
  2. 앱 기동 1초, 3초, 7초 후 3회에 걸친 안전 보정 타이머 실행
  3. 세 번째 모니터(`X: 3425, Y: 1446, 2048×1152`)가 확인되는 즉시 해당 좌표로 자동 이동 및 보더리스 전체화면 확장

### (3) 상단 바 원클릭 제어
* 앱 헤더 우측 상단에 **`[● 모니터3 자동시작: ON]`** 버튼이 상시 노출되어 등록 상태를 직관적으로 확인하고, 필요할 때 클릭하여 토글할 수 있습니다.

---

## 5. 🔄 윈도우 재설치(Clean Install) 시 원클릭 복원 절차

1. **사전 준비**: Node.js (v18+ LTS), Git for Windows, NVIDIA 최신 드라이버.
2. **저장소 클론 및 패키지 설치**:
   ```powershell
   git clone https://github.com/kimjiho680629/Sys_Dash.git C:\Gemini_job\SysDash
   cd C:\Gemini_job\SysDash
   npm install
   ```
3. **독립 배포본 빌드**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scratch/build_standalone.ps1
   ```
4. **실행 및 자동 시작 활성화**:
   * [SysDash.exe](SysDash.exe) 실행 후 상단 `[● 모니터3 자동시작]` 버튼 활성화 확인.

---

## 6. 🧩 새로운 시스템에 적용하기 (New Hardware Customization Guide)

1. **원클릭 하드웨어 사양 감지**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scratch/detect_system_specs.ps1
   ```
   * 터미널에 표시된 모니터 번호/해상도/좌표, CPU/GPU/RAM/Disk 스펙을 확인합니다.
2. **대상 모니터 설정 ([src/main.js](src/main.js))**:
   * `findMonitor3()` 함수의 `bounds.x`, `width`, `height` 또는 디스플레이 인덱스를 새 환경에 맞게 수정.
3. **하드웨어 센서 기본값 ([src/collector.js](src/collector.js))**:
   * `this.cpuStatic`, `this.ramSpeed`, GPU 이름 및 VRAM 용량을 새 부품 사양으로 업데이트.
4. **UI 표시 텍스트 ([src/renderer/index.html](src/renderer/index.html))**:
   * `cpuName`, `gpuName`, `ramSpec`, 스토리지 드라이브 명칭 수정.
5. **실물 부품 사진 교체 ([src/renderer/assets/hardware/](src/renderer/assets/hardware/))**:
   * `cpu.jpg`, `gpu.jpg`, `ram.jpg`, `ssd.jpg`, `net.jpg`를 새 부품 사진으로 교체 (정사각 권장).

