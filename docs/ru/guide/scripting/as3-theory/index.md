# Теория AS3 модов {#as3-mods}

Пользовательский интерфейс игры состоит из совокупности окон (`Windows`), которыми управляет движок `wulf`. Сами окна могут быть реализованы на:
- `GF` – Coherent GameFace, это `HTML` + `JavaScript` + `CSS`
- `Unbound` – собственный фреймворк Лесты
- `Scaleform` – это `Flash`, в котором используется язык программирования `ActionScript 3` (AS3)

Наиболее распространённым способом создания графических модов является использование `Scaleform`.

## Scaleform {#scaleform}
`Scaleform` — это технология, которая позволяет запускать `Flash`‑приложения внутри игры, аналогично тому, как они раньше запускались в браузере с помощью плагина `Adobe Flash Player`.

`Flash`‑приложения пишутся на языке `ActionScript 3` (AS3) и компилируются в файл с расширением `.swf`, который содержит скрипты, картинки, анимации и другие ресурсы, необходимые для работы приложения. Игра умеет работать с такими файлами и отображать их в интерфейсе.

У `SWF`‑файлов всегда есть точка входа — главный класс, экземпляр которого создаётся при загрузке.

## DAAPI {#daapi}
Для взаимодействия `AS3`‑кода с `Python`‑скриптами используется механизм `DAAPI` (Direct Access API). Он позволяет связать `AS3`‑класс с `Python`‑классом, чтобы они могли обмениваться данными, вызывая методы друг друга. Связь образуется между указанным `Python`‑классом и основным классом `AS3`, указанным в точке входа `SWF`‑файла.

### Пример классов {#class-example}
:::code-group
```actionscript-3 [HelloWorldWindow.as]
public class HelloWorldWindow extends AbstractWindowView
{
  public var py_DemoFunction:Function;

  public function as_DemoFunction(message:String):void {
    trace("Message from Python: " + message);
  }

  public function sendMessageToPython(message:String):void {
    py_DemoFunction(message);
  }
}
```


```python [HelloWorldWindow.py]
class HelloWorldWindow(AbstractWindowView):
  def py_DemoFunction(self, message):
    print("Message from AS3: {}".format(message))

  def as_DemoFunction(self, message):
    self.flashObject.as_DemoFunction(message)
```
:::

Префиксы `as_` и `py_` не являются обязательными, но они помогают отличать методы, которые вызываются из другого языка.

Если создать связку между этими двумя классами, то можно будет в `Python`‑коде обратиться к `self.flashObject` и вызывать на нём метод, объявленный в `AS3`. И наоборот, в `AS3`‑коде можно объявить переменную типа `Function`, которая будет ассоциирована с методом из `Python`‑класса.

### Создание связки {#daapi-binding}
Чтобы связать `AS3`‑класс с `Python`‑классом, необходимо в `g_entitiesFactories` зарегистрировать `ViewSettings`, указав класс `Python` и путь к `SWF`‑файлу.

```python
from frameworks.wulf.gui_constants import WindowLayer
from gui.Scaleform.framework import g_entitiesFactories, ScopeTemplates, ViewSettings

viewSettings = ViewSettings(
  'MY_MOD_HELLO_WORLD_WINDOW', # уникальный ID окна
  HelloWorldWindow, # управляющий класс Python
  "HelloWorldWindow.swf", # путь к SWF файлу
  WindowLayer.TOP_WINDOW,
  None,
  ScopeTemplates.VIEW_SCOPE,
)
g_entitiesFactories.addSettings(viewSettings)
```

### Добавление окна в интерфейс {#adding-window}
После регистрации `SWF`‑файла его можно открыть в интерфейсе, вызвав метод `loadView` на текущем Scaleform‑приложении. В качестве аргумента передаётся `ViewLoadParams`, в котором указывается уникальный ID окна, указанный при регистрации.

```python
from helpers import dependency
from skeletons.gui.app_loader import IAppLoader
from gui.Scaleform.framework.managers.loaders import SFViewLoadParams

appLoader = dependency.instance(IAppLoader)
app = appLoader.getApp()
app.loadView(SFViewLoadParams('MY_MOD_HELLO_WORLD_WINDOW'))
```

## Тестирование SWF без перезапуска игры {#hot-reload}

Во время разработки `SWF` не обязательно каждый раз упаковывать в `.mtmod` и перезапускать игру. После сборки копируйте файл в `res_mods`, сохраняя его путь относительно каталога ресурсов (`gui\flash\...`):

```text
<GameRoot>\res_mods\<GAME_VERSION>\gui\flash\reload-exmaple\HelloWorldWindow.swf
```

На время разработки зарегистрируйте окно с путём к этому файлу относительно каталога `gui/flash`:

```python
DEV_SWF = 'reload-exmaple/HelloWorldWindow.swf'

viewSettings = ViewSettings(
  'MY_MOD_HELLO_WORLD_WINDOW',
  HelloWorldWindow,
  DEV_SWF,
  WindowLayer.TOP_WINDOW,
  None,
  ScopeTemplates.VIEW_SCOPE,
)
g_entitiesFactories.addSettings(viewSettings)
```

Файл не обязательно размещать в корне `gui/flash`: каталог `reload-exmaple` в примере нужен, чтобы получить отдельный виртуальный путь для разработки. Вы можете выбрать другое имя, главное — чтобы итоговый путь не совпадал с существующими ресурсами игры и с путём `SWF` внутри вашего `.mtmod`.

Регистрировать окно заново после каждой сборки не нужно. Чтобы загрузить обновлённый `SWF`, уничтожьте старое окно, дождитесь следующего кадра и только затем создайте его снова:

```python
import BigWorld

from gui.Scaleform.framework.managers.loaders import SFViewLoadParams
from helpers import dependency
from skeletons.gui.app_loader import IAppLoader

VIEW_ALIAS = 'MY_MOD_HELLO_WORLD_WINDOW'

def loadMyView():
  app = dependency.instance(IAppLoader).getApp()
  app.loadView(SFViewLoadParams(VIEW_ALIAS))

def reload():
  app = dependency.instance(IAppLoader).getApp()
  app.containerManager.destroyViews(VIEW_ALIAS)
  BigWorld.callback(0, loadMyView)
```

После замены файла вызывайте `reload()` через [WotREPL](../../first-steps/pjorion/) или по кнопке из самого мода. Важно уничтожить все открытые окна, использующие этот `SWF`: пока хотя бы одно из них существует, Scaleform может продолжить использовать предыдущую версию файла. Вызов `loadMyView()` в том же кадре также загрузит старую версию, поэтому `BigWorld.callback(0, ...)` здесь обязателен.
