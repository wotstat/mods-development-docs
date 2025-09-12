# Настройка окружения для AS3-мода (с графической частью) {#as3-setup}

Чисто `AS3` моды возможны, однако, в большинстве случаев, вам понадобится вспомогательный `Python` скрипт, который будет взаимодействовать с игрой и управлять графической частью мода.

Поэтому подразумевается, что у вас уже настроено окружение для `Python` модов. Если это не так, сначала настройте его, следуя [инструкции по настройке окружения для Python](../python/).

## Немного теории {#theory}
Пользовательский интерфейс игры состоит из совокупности окон (`Windows`), которыми управляет движок `wulf`. Сами окна могут быть реализованы на:
- `CGF` – Coherent GameFace, это `HTML` + `JavaScript` + `CSS`
- `Unbound` – собственный фреймворк Лесты
- `Scaleform` – это `Flash`, в котором используется язык программирования `ActionScript 3` (AS3)

Наиболее распространённым способом создания графических модов является использование `Scaleform`.

### Scaleform {#scaleform}
`Scaleform` — это технология, которая позволяет запускать `Flash`‑приложения внутри игры, аналогично тому, как они раньше запускались в браузере с помощью плагина `Adobe Flash Player`.

`Flash`‑приложения пишутся на языке `ActionScript 3` (AS3) и компилируются в файл с расширением `.swf`, который содержит скрипты, картинки, анимации и другие ресурсы необходимые для работы приложения. Игра умеет работать с такими файлами и отображать их в интерфейсе.

### DAAPI {#daapi}
Для взаимодействия `AS3`‑кода с `Python` скриптами, используется специальный механизм `DAAPI` (Direct Access API). Этот механизм позволяет связать `AS3`‑класс с `Python`‑классом, чтобы они могли обмениваться данными вызывая методы друг друга.

## Необходимые инструменты {#tools}
- Полностью настроенное окружение для `Python` модов (см. [инструкцию по настройке окружения для Python](../python/))
- [ActionScript & MXML](https://marketplace.visualstudio.com/items?itemName=bowlerhatllc.vscode-as3mxml) – расширение для VSCode, которое добавляет поддержку ActionScript
  - [Java JDK 11+](https://www.oracle.com/java/technologies/downloads/#jdk24-windows) – последняя версия `JDK` необходима для работы расширения
  - `AIRSDK` – набор инструментов для компиляции `AS3` необходим для работаы расширения. Устанавливается через [AIR SDK Manager](https://airsdk.harman.com/download)
![AIR SDK Manager](./assets/air-sdk-manager.png){width=400}
- [Apache Royale](https://royale.apache.org/download/) – компилятор `AS3` в `SWF`. Нужно скачать архив `APACHE ROYALE JS/SWF` и распаковать его в удобное место на диске, например `C:\apache-royale`.

::: warning ВАЖНО
При загрузке `Apache Royale` не перепутайте версии `JS-ONLY` и `JS/SWF`, необходима именно версия с `JS/SWF`.
:::

## Организация проекта {#project-structure}
Мы расширим структуру проекта, которая была описана в [инструкции по настройке окружения для Python](../python/).
`AS3` часть мода полностью независима от `Python` части, поэтому её исходный код не нужно помещать в папку `res`, создайте в корне проекта папку `as3`, в которой разместим папки:
- `src/my/first_mod` – корневая папка вашего `AS3` мода, в которой будет находиться весь исходный код.
- `lib` – здесь будут находиться сторонние библиотеки, которые понадобятся для компиляции
- `bin` – здесь будет находиться скомпилированный файл `SWF`

Так же создайте конфигурационный файл `asconfig.json`, в котором будут указаны настройки для расширения и `build-config.xml` для настроек компиляции `SWF`. А так же файл `build.bat`, который будет запускать компиляцию.

```
my-first-mod/
└── as3/
├── bin/
├── lib/
│   └── ... (сторонние библиотеки)
├── src/
│   └── my/
│       └── first_mod/
│           └── ... (исходный код AS3 мода)
├── build-config.xml
├── asconfig.json
└── build.bat
```

### Библиотеки игры SWC {#game-swc}
Для того, чтобы мод мог взаимодействовать с компонентами игры, необходимо подключить к проекту внешние библиотеки игры в формате `SWC`.

Эти библиотеки поставляются вместе с игрой и находятся в пакетах `res/packages/gui-part.pkg/gui/flash/swc` относительно корня игры. Формат `.pkg` нужно открыть с помощью архиватора, например `7-Zip`.

::: warning ВАЖНО
Пакет `gui-part` разбит на два отдельных `gui-part1.pkg` и `gui-part2.pkg` архива, часть нужных библиотек находится в первом, часть во втором.
:::

Перенесите эти `SWC` файлы в папку с модом `as3/lib/`. Должно получиться 11 фалов:
- `base_app-1.0-SNAPSHOT.swc`
- `battle.swc`
- `common_i18n_library-1.0-SNAPSHOT.swc`
- `common-1.0-SNAPSHOT.swc`
- `damageIndicator.swc`
- `directionIndicator.swc`
- `gui_base-1.0-SNAPSHOT.swc`
- `gui_battle-1.0-SNAPSHOT.swc`
- `gui_lobby-1.0-SNAPSHOT.swc`
- `lobby.swc`
- `predictionIndicator.swc`

В дополнение к игровым библиотекам, вам необходима ещё основная библиотека `playerglobal.swc`, [скачайте](/download/playerglobal.swc){target="_blank"} её и поместите в папку `as3/lib/`.

### Конфигурация компиляции AS3 {#as3-config}
Заполните файлы `asconfig.json` и `build-config.xml` следующим содержимым:
::: code-group
<<< ./assets/asconfig.json{json :line-numbers}
<<< ./assets/build-config.xml{xml :line-numbers}
:::

В `build-config.xml` на 38 строке указывается путь к выходному файлу `SWF`, измените его при необходимости.
```xml:line-numbers=38
<output>bin/my.first_mod.swf</output>
```

### Скрипт сборки {#build-script}
Заполните файл `as3/build.bat` следующим содержимым:
::: code-group
```bat [build.bat]:line-numbers
@echo off

rem ==== настройки ====
set "MXML_PATH=C:\apache-royale"

rem ==== компиляция ====
"%MXML_PATH%\royale-asjs\js\bin\mxmlc" -load-config+=build-config.xml --output=bin/my.first_mod.swf src/my/first_mod/HelloWorldWindow.as
```
:::

На 7 строке команда с помощью которой мы компилируем `SWF`:
- `-load-config+=build-config.xml` – указывает на файл с настройками компиляции
- `--output=bin/my.first_mod.swf` – указывает путь к выходному `SWF` файлу
- `src/my/first_mod/HelloWorldWindow.as` – указывает на файл с исходным кодом

Если вам в модификации понадобится несколько `SWF` файлов, то просто добавьте в `build.bat` ещё одну команду для компиляции с другими параметрами.

В разделе `настройки` укажите путь к папке, в которую вы распаковали `Apache Royale`.

#### Обновление основного скрипта сборки {#update-build-script}
Обновление основного скрипта не требуется, если вы настроили по инструкции [окружение для Python](../python/), то можете убедиться, что там есть блок, который запускает `as3/build.bat`:
```bat:line-numbers=44 {4}
if exist ".\as3\build.bat" (
  pushd ".\as3"
  del /Q /F ".\bin\*.swf"
  call build.bat
  xcopy ".\bin\*.swf" "..\build\res\gui\flash\" /Y /I >nul
  popd
)
```

## Подготовка тестового мода {#test-mod}
Для проверки работоспособности отобразим в игре окно с надписью `Hello, World!`.

Создадим в папке `as3/src/my/first_mod/` файл `HelloWorldWindow.as` со следующим содержимым:
```actionscript-3
package my.first_mod
{
    import net.wg.infrastructure.base.AbstractWindowView;
    public class HelloWorldWindow extends AbstractWindowView
    {

    }
}
```

## Проверочный запуск #{test-run}
