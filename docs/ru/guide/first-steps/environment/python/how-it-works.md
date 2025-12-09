**Разбор аргументов**

В этом блоке скрипт присваивает значение переменной `v` из аргумента командной строки `-v <version>`, который указывает версию мода.

```bat:line-numbers=10
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
```

---
**Очистка и подготовка build**

Процесс компиляции происходит в папке `build`, которая создаётся заново при каждом запуске скрипта. В этой папке создаётся структура, аналогичная той, что используется в игре, и в неё копируются все ресурсы из папки `res` вашего проекта.

```bat:line-numbers=28
if exist ".\build" rmdir /S /Q ".\build"
mkdir ".\build"
xcopy ".\res" ".\build\res" /E /I /Y >nul
```

---
**Проставить версию**

В этом блоке скрипт ищет в точке входа мода маркер <span v-pre>`{{VERSION}}`</span> и заменяет его на значение переменной `v`, которая была установлена из аргумента командной строки.

```bat:line-numbers=33
set "configPath=.\build\res\scripts\client\gui\mods\%MOD_ENTRY%"
if exist "%configPath%" (
  powershell -NoProfile -Command ^
    "(Get-Content '%configPath%' -Raw -Encoding utf8) " ^
    "-replace '\{\{VERSION\}\}','%v%' | " ^
    "Set-Content '%configPath%' -Encoding utf8"
) else (
  echo [WARN] %configPath% not found.
)
```

---
**Байткод Python 2**

Происходит компиляция всех `.py`‑файлов в папке `build` в байткод `.pyc`, который используется игрой.

```bat:line-numbers=44
python -m compileall ".\build"
```

---
**Компиляция в SWF**

Запускается скрипт `build.bat` из папки `as3`, если такая папка есть в корне проекта. Этот скрипт должен скомпилировать все `ActionScript`‑файлы в `SWF`‑файлы и поместить их в папку `./as3/bin`. После этого все `SWF`‑файлы копируются в папку `build/res/gui/flash`, откуда попадают в файл мода.

```bat:line-numbers=47
if exist ".\as3\build.bat" (
  pushd ".\as3"
  del /Q /F ".\bin\*.swf"
  call build.bat
  xcopy ".\bin\*.swf" "..\build\res\gui\flash\" /Y /I >nul
  popd
)
```

---
**meta.xml с версией**

Аналогично точке входа в `meta.xml` проставляется версия мода.

```bat:line-numbers=56
if exist ".\meta.xml" (
  powershell -NoProfile -Command ^
    "$m = Get-Content '.\meta.xml' -Raw -Encoding utf8; " ^
    "$m = $m -replace '\{\{VERSION\}\}','%v%'; " ^
    "Set-Content '.\build\meta.xml' $m -Encoding utf8"
) else (
  echo [ERROR] meta.xml not found.
  exit /b 1
)
```

---
**Упаковка в .mtmod (7-Zip)**

Происходит упаковка необходимых файлов в архив `.mtmod` с помощью 7-Zip. Упаковываются только файлы с расширениями `.pyc`, `.swf`, `.png` и `meta.xml`.

```bat:line-numbers=67
pushd ".\build"

set "folder=%MOD_NAME%_%v%.mtmod"
if exist "%folder%" del /Q "%folder%"

"%SEVENZIP%" a -tzip -mx=0 "%folder%" ".\*.pyc" -r >nul
"%SEVENZIP%" a -tzip -mx=0 "%folder%" ".\*.swf" -r >nul
"%SEVENZIP%" a -tzip -mx=0 "%folder%" ".\meta.xml" >nul
"%SEVENZIP%" a -tzip -mx=0 "%folder%" ".\*.png" -r >nul

popd
```
