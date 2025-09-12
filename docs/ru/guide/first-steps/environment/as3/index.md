# Настройка окружения для AS3-мода (с графической частью) {#as3-setup}

Чисто `AS3` моды возможны, однако, в большинстве случаев, вам понадобится вспомогательный `Python` скрипт, который будет взаимодействовать с игрой и управлять графической частью мода.

Поэтому подразумевается, что у вас уже настроено окружение для `Python` модов. Если это не так, сначала настройте его, следуя [инструкции по настройке окружения для Python](../python/).

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
Для проверки работоспособности отобразим в ангаре игровое окно.

Создадим в папке `as3/src/my/first_mod/` файл `HelloWorldWindow.as` со следующим содержимым:
```actionscript-3
package my.first_mod
{
  import net.wg.infrastructure.base.AbstractWindowView;
  import flash.text.TextField;

  public class HelloWorldWindow extends AbstractWindowView
  {
    public function HelloWorldWindow()
    {
      super();
    }

    override protected function onPopulate():void
    {
      super.onPopulate();
      width = 400;
      height = 100;
      window.title = 'My First Mod Window';
      window.useBottomBtns = false;

      var textStateText:TextField = new TextField();
      textStateText.width = 384;
      textStateText.height = 84;
      textStateText.x = 8;
      textStateText.y = 8;
      textStateText.text = 'Мод работает, УРА!';

    }
  }
}
```

### Отображение окна из Python {#show-window}
Для того, что бы окно появилось в игре, нужно из `Python` скрипта добавить его на экран. Для этого, в создадим управляющий `Python`-класс (подробнее в [теории AS3](../../../scripting/as3-theory/)).

## Проверочный запуск #{test-run}
