@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ==== настройки ====
set "SEVENZIP=C:\Program Files\7-Zip\7z.exe"
set "MOD_NAME=my.first-mod"
set "MOD_ENTRY=mod_myFirstMod.py"

rem ==== разбор аргументов ====
set "v="
:parse
if "%~1"=="" goto after_parse
if /I "%~1"=="-v" (
  if "%~2"=="" (echo [ERROR] Missing value for -v & exit /b 1)
  set "v=%~2"
  shift & shift & goto parse
)
echo Usage: %~nx0 -v ^<version^>
exit /b 1

:after_parse
if not defined v (
  echo [ERROR] Version is required. Use -v ^<version^>.
  exit /b 1
)

rem ==== очистка и подготовка build ====
if exist ".\build" rmdir /S /Q ".\build"
mkdir ".\build"
xcopy ".\res" ".\build\res" /E /I /Y >nul

rem ==== проставить версию ====
set "configPath=.\build\res\scripts\client\gui\mods\%MOD_ENTRY%"
if exist "%configPath%" (
  powershell -NoProfile -Command "(Get-Content '%configPath%' -Raw) -replace '\{\{VERSION\}\}','%v%' | Set-Content '%configPath%' -Encoding utf8"
) else (
  echo [WARN] %configPath% not found.
)

rem ==== байткод Python 2 ====
python -m compileall ".\build"

rem ==== билдим SWF ====
if exist ".\as3\build.bat" (
  pushd ".\as3"
  del /Q /F ".\bin\*.swf"
  call build.bat
  xcopy ".\bin\*.swf" "..\build\res\gui\flash\" /Y /I >nul
  popd
)

rem ==== meta.xml с версией ====
if exist ".\meta.xml" (
  powershell -NoProfile -Command "$m = Get-Content '.\meta.xml' -Raw; $m = $m -replace '\{\{VERSION\}\}','%v%'; Set-Content '.\build\meta.xml' $m -Encoding utf8"
) else (
  echo [ERROR] meta.xml not found.
  exit /b 1
)

rem ==== упаковка в .mtmod (7-Zip) ====
pushd ".\build"


set "folder=%MOD_NAME%_%v%.mtmod"
if exist "%folder%" del /Q "%folder%"

rem без сжатия, только нужные типы
"%SEVENZIP%" a -tzip -mx=0 "%folder%" ".\*.pyc" -r >nul
"%SEVENZIP%" a -tzip -mx=0 "%folder%" ".\*.swf" -r >nul
"%SEVENZIP%" a -tzip -mx=0 "%folder%" ".\meta.xml" >nul
"%SEVENZIP%" a -tzip -mx=0 "%folder%" ".\*.png" -r >nul

popd

copy /Y ".\build\%folder%" ".\%folder%" >nul
rmdir /S /Q ".\build"


echo Done: %folder%
endlocal
exit /b 0