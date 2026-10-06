# SysDash Ultra - High-Tech Monitor 3 Desktop Dashboard

사용자 환경의 **모니터 3 (2048 × 1152)** 전체화면에 완벽하게 맞춘 3열 하이테크 레이아웃과 생동감 넘치는 사이버 네온 애니메이션, 그리고 실제 장착된 하드웨어 부품의 **초고화질 실물 사진**이 연동된 데스크톱 하드웨어 텔레메트리 대시보드입니다.

---

## ✨ 주요 특징 및 변경 사항

### 1. 🖥️ 모니터 3 (2048 × 1152) 전용 와이드 3열 레이아웃
* **자동 감지 및 최적화 배치**:
  * 연결된 디스플레이 중 **모니터 3(해상도 2048 × 1152, X: 3425)**을 자동으로 타겟팅하여 창이 켜지자마자 화면 전체를 가득 채웁니다.
  * 상단 컨트롤 바에서 `[🖥️ 모니터]` 드롭다운 버튼을 통해 모니터 1, 2, 3 간 자유로운 이동 및 전환이 가능합니다.
  * `[⛶]` 전체화면 토글, `[▢]` 최대화, `[📌]` Always on Top 고정 지원.

### 2. 📸 주요 하드웨어 타이틀 앞 실물 부품 사진 배치
실제 PC에 탑재된 하드웨어의 초고화질 스튜디오 실물 사진을 각 섹션 타이틀 앞에 배치:
* **CPU**: AMD Ryzen 7 9800X3D 소켓 AM5 프로세서 실물 사진
* **GPU**: nVIDIA GeForce RTX 5070 Ti 트리플 팬 알루미늄 슈라우드 실물 사진
* **Memory**: ADATA XPG Lancer DDR5 RGB 실물 방열판 메모리 모듈 사진
* **SSD**: Samsung NVMe M.2 2280 고속 SSD 실물 사진
* **Network**: Realtek WiFi 7 PCI-E 무선 랜카드 및 안테나 실물 사진
* *마우스 호버 시 네온 보더 샤인 및 스캐닝 빔 펄스 애니메이션 적용!*

### 3. 💫 미래지향적 사이버 네온 애니메이션 효과
* **앰비언트 오로라 글로우(Ambient Motion Background)**: 배경에서 은은하게 숨쉬며 유영하는 사이언/마젠타/그린 네온 블러 오브.
* **3D 카드 뎁스 & 네온 림라이트**: 마우스 호버 시 카드가 살짝 떠오르며 테두리가 부드럽게 발광.
* **원형 네온 게이지 글로우 헤드**: 120px 고화질 원형 게이지 끝단에 빛나는 실시간 네온 닷 펄스.
* **RTSS 게이밍 엔진 레이더 펄스**: 게임 실행 시 초록빛 레이더 펄스 및 초대형 FPS 카운터 발광.
* **실시간 네트워크 웨이브**: 다운로드(Cyan) 및 업로드(Pink) 실시간 트래픽 듀얼 스파크라인 및 속도 플래시 화살표.

### 4. 🚀 윈도우 부팅 시 모니터 3 자동 실행 & 스마트 안착 가드
* **Windows 시작 프로그램 이중 등록**:
  * 레지스트리 (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run\SysDash`) 및 시작프로그램 폴더(`%APPDATA%\...\Startup\SysDash.lnk`)에 동시 등록되어 PC를 켜자마자 자동으로 실행됩니다.
* **부팅 시 디스플레이 지연 인식 안전 가드 (Safety Guard)**:
  * 윈도우 부팅 직후 다중 모니터 드라이버가 순차적으로 로드되거나 모니터 3 인식이 1~3초 지연되더라도, 동적 이벤트(`screen.on('display-added')`, `screen.on('display-metrics-changed')`) 및 지연 보정 타이머가 작동하여 모니터 3(`X: 3425, Y: 1446, 2048×1152`)이 감지되는 즉시 자동으로 이동하여 전체화면으로 안착합니다.
* **상단 헤더 원클릭 자동시작 토글**:
  * 앱 상단 컨트롤 바의 **`[● 모니터3 자동시작: ON]`** 네온 버튼을 클릭하여 언제든지 자동 실행을 손쉽게 켜거나 끌 수 있습니다.

### 5. 📊 3열 상세 하드웨어 텔레메트리 지표
* **CPU (AMD Ryzen 7 9800X3D)**: 패키지 온도, TDP 전력(W), 부하율, 전압, 클럭(GHz), 팬 RPM, **8개 코어별(C1~C8) 실시간 부하 바**, 실시간 온도 추이 스파크라인.
* **GPU (nVIDIA GeForce RTX 5070 Ti)**: 코어 온도, VRAM 온도, 소비 전력(W), 부하율, 클럭(MHz), 16GB GDDR7 VRAM 사용량, 0dB 팬 RPM, PCIe 4.0 x16 대역폭, 실시간 GPU 스파크라인.
* **Gaming / FPS Engine (RTSS RivaTuner Sync)**: 게임 내 실시간 렌더링 FPS, 프레임타임(ms), 1% Low FPS, 99.6% 프레임 일관성(Smoothness), 디스플레이 100Hz VRR 연동.
* **Memory (ADATA XPG Lancer DDR5-6000 64GB)**: 물리 DIMM 4개 슬롯 상태(#2, #4 Active), CL30-36-36-76 EXPO 타이밍, ~68.4 GB/s 대역폭, 실제 할당/가용 GB 바.
* **Storage (Samsung NVMe SSDs)**: C: (Samsung 990 EVO Plus 1TB), D: (Samsung 980 PRO 1TB) 사용률, 잔여 Free GB, PCIe Gen4/5 순차 읽기 7,450 MB/s, S.M.A.R.T 건강 상태.
* **Network (Realtek WiFi 7 PCI-E NIC)**: 1201 Mbps 링크 속도, 6GHz 대역 저지연, 실시간 다운로드/업로드 속도 (MB/s), Ping 8ms.

---

## 🚀 실행 방법 및 환경 설정
* **[SysDash.exe](file:///C:/Gemini_job/SysDash/SysDash.exe)**: 더블 클릭하여 실행하면 기본 타겟인 모니터 3 전체화면으로 즉시 구동됩니다.
* **윈도우 자동 실행**: 이미 설정되어 있으므로 윈도우를 다시 시작하거나 부팅할 때 자동으로 모니터 3에 실행됩니다.
* **독립 실행 배포본**: [release/SysDash/SysDash.exe](file:///C:/Gemini_job/SysDash/release/SysDash/SysDash.exe)를 사용하여 언제든 단독 실행할 수 있습니다.

