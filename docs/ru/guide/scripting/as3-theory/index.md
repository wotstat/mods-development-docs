# Теория AS3 модов {#as3-mods}

Пользовательский интерфейс игры состоит из совокупности окон (`Windows`), которыми управляет движок `wulf`. Сами окна могут быть реализованы на:
- `CGF` – Coherent GameFace, это `HTML` + `JavaScript` + `CSS`
- `Unbound` – собственный фреймворк Лесты
- `Scaleform` – это `Flash`, в котором используется язык программирования `ActionScript 3` (AS3)

Наиболее распространённым способом создания графических модов является использование `Scaleform`.

## Scaleform {#scaleform}
`Scaleform` — это технология, которая позволяет запускать `Flash`‑приложения внутри игры, аналогично тому, как они раньше запускались в браузере с помощью плагина `Adobe Flash Player`.

`Flash`‑приложения пишутся на языке `ActionScript 3` (AS3) и компилируются в файл с расширением `.swf`, который содержит скрипты, картинки, анимации и другие ресурсы необходимые для работы приложения. Игра умеет работать с такими файлами и отображать их в интерфейсе.

У `SWF` файлов всегда есть явно указанная точка входа – это главный класс, экземпляр которого будет создан при загрузке файла.

## DAAPI {#daapi}
Для взаимодействия `AS3`‑кода с `Python` скриптами, используется специальный механизм `DAAPI` (Direct Access API). Этот механизм позволяет связать `AS3`‑класс с `Python`‑классом, чтобы они могли обмениваться данными вызывая методы друг друга. Связь образуется между указанным `Python`‑классом и основным классом `AS3`, который указан в точке входа `SWF` файла.

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

Если создать связку между этими двумя классами, то можно будет в `Python` коде обратиться к `self.flashObject` и вызывать на нём метод объявленный в `AS3`. И наоборот, в `AS3`‑коде можно объявить переменную типа `Function`, которая будет проассоциирована с методом из `Python`‑класса.

### Создание связки {#daapi-binding}
Чтобы связать `AS3`‑класс с `Python`‑классом необходимо в `g_entitiesFactories` зарегистрировать `ViewSettings`, в котором указать класс `Python` и путь к `SWF`‑файлу.

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

### Добавления окна в интерфейс {#adding-window}
После того, как мы зарегистрировали `SWF` файл, его можно открыть в интерфейсе, вызвав метод `loadView` на текущем Scaleform приложении. В качестве аргумента передаётся `ViewLoadParams`, в котором указывается уникальный ID окна, который мы указали при регистрации.

```python
from helpers import dependency
from skeletons.gui.app_loader import IAppLoader
from gui.Scaleform.framework.managers.loaders import SFViewLoadParams

appLoader = dependency.instance(IAppLoader)
app = appLoader.getApp()
app.loadView(SFViewLoadParams('MY_MOD_HELLO_WORLD_WINDOW'))
```
