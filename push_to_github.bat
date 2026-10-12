@echo off
chcp 65001 > nul
echo ============================================================
echo   SysDash WinVer - GitHub 푸시 (Windows-SysDash)
echo ============================================================
echo.
echo 원격 저장소 대상: https://github.com/kimjiho680629/Windows-SysDash.git
echo.
echo [1] GitHub에 'Windows-SysDash' 저장소가 생성되어 있는지 확인하세요.
echo     (아직 생성하지 않았다면: https://github.com/new 에서 생성)
echo.
echo [2] GitHub 푸시를 시작합니다...
echo     (인증 창이 뜨면 브라우저에서 로그인/승인을 진행하세요)
echo.

git remote set-url origin https://github.com/kimjiho680629/Windows-SysDash.git
git push -u origin master

echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================================
    echo [성공] GitHub에 SysDash WinVer가 성공적으로 푸시되었습니다!
    echo ============================================================
) else (
    echo ============================================================
    echo [안내] 푸시에 실패했습니다.
    echo 1. https://github.com/new 에서 'Windows-SysDash' 저장소를 만들었는지 확인하세요.
    echo 2. 기존 'Sys_Dash' 저장소의 이름을 'Windows-SysDash'로 변경해도 됩니다.
    echo ============================================================
)
echo.
pause
