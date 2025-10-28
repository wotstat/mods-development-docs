# Теория Gameface модов {#gameface-theory}

Пользовательский интерфейс игры состоит из совокупности окон (`Windows`), которыми управляет движок `wulf`. Сами окна могут быть реализованы на:
- `CGF` – Coherent GameFace, это `HTML` + `JavaScript` + `CSS`
- `Unbound` – собственный фреймворк Лесты
- `Scaleform` – это `Flash`, в котором используется язык программирования `ActionScript 3` (AS3)

## Coherent Gameface {#coherent-gameface}

`Coherent Gameface` (CGF) — это технология, которая позволяет создавать интерфейсные окна с использованием веб-технологий: `HTML`, `CSS` и `JavaScript`. Такие окна отображаются внутри игры. Движок для отображения этих окон похож на браузер, однако оптимизирован для работы в игровом окружении.

Для выполнения `JavaScript`-кода в окнах CGF используется движок `V8`, который также применяется в браузере `Google Chrome`.

Ознакомиться с документацией по `Coherent Gameface` можно на официальном сайте: [https://docs.coherent-labs.com/cpp-gameface/](https://docs.coherent-labs.com/cpp-gameface/), учтите, что игра использует не самую свежую версию `CGF`, поэтому некоторые функции могут быть недоступны.

Важными отличиями `CGF` от обычного браузера являются:
- Задержка между установкой `CSS` стилей и их применением к элементам страницы (2 кадра)
- Работа с анимациями `CSS` - `CGF` предоставляет оптимизированную структуру для выполнения анимаций, прямое манипулирование стилями ухудшает производительность
- Масштабирование реализовано путём установки `font-size: 2px` на корневой элемент страницы, поэтому все размеры на странице должны быть заданы в `em` или `rem` единицах
- В качестве лейаута страницы по умолчанию используется `flexbox`
- Доступны фильтры для взаимодействия с фоном игры, например блюр

## Окна CGF в игре {#cgf-windows}
Как браузер состоит из разных вкладок, внутри каждой из которых "живёт" своя веб-страница, так и в игре разные компоненты интерфейса реализованы в виде отдельных окон `CGF`, каждое из которых загружает свою страницу. Отличием от браузера является то, что на одном экране может находиться сразу несколько окон `CGF`. Например ангар на `Lesta` состоит из смеси `CGF`-окон и `Scaleform`-окон.


## Обмен данными между Python и JavaScript {#python-javascript-interaction}
Для взаимодействия `JavaScript`-кода страницы с `Python`-скриптами игры использутся реактивная ViewModel система. Окно определяется классом `View(ViewImpl)`, который инициализирует модель данных `Model(ViewModel)`, в которой определяются `значения (properties)` и `команды (commands)`.

- Команды (`JS -> Python`) — это события, которые могут быть вызваны из `JavaScript`-кода страницы и обработаны в `Python`-скриптах.
- Значения (`Python -> JS`) — это реактивные данные, которые могут быть изменены из `Python`-скриптов и прочитаны в `JavaScript`-коде страницы. Когда значение изменяется в `Python`, об этом автоматически уведомляется `JavaScript`-код страницы.

```python [example_view.py]
from frameworks.wulf import ViewModel
from gui.impl.pub import ViewImpl

class ExampleModel(ViewModel):
  def __init__(self, properties=3, commands=1):
    super(ExampleModel, self).__init__(properties=properties, commands=commands)

  def _initialize(self):
    super(ExampleModel, self)._initialize()

    self._addStringProperty('exampleString', '')
    self._addNumberProperty('exampleNumber', 0)
    self._addBoolProperty('exampleBool', False)
    self.exampleCommand = self._addCommand('exampleCommand')


class ExampleView(ViewImpl):
  viewLayoutID = ModDynAccessor('RES_JSON_KEY')
  
  def __init__(self, server, pageName='', pageId=''):
    settings = ViewSettings(ExampleView.viewLayoutID(), flags=ViewFlags.VIEW, model=CDPModel())
    super(ExampleView, self).__init__(settings)
  
  @property
  def viewModel(self):
    return super(ExampleView, self).getViewModel()
```

## Ресурсы игры (res_map.json) {#res-map}
Для использования в Python-скриптах различных ресурсов известных на этапе компиляции игры, Мир Танков использует механизм `DynAccessor` и файл `res_map.json`, на который эти `DynAccessor` ссылаются.

```json [res_map.json]
{
  ...
  "f4": {
    "type": "Layout",
    "path": "coui://gui/gameface/_dist/production/lobby/crew/CrewHeaderTooltipView/CrewHeaderTooltipView.html",
    "parameters": {
      "entrance": "CrewHeaderTooltipView",
      "extension": "",
      "impl": "gameface"
    }
  },
  "10db6": {
    "type": "Image",
    "path": "img://gui/maps/icons/crewWidget/buttonsBar/background.png",
    "parameters": {
      "extension": "",
    }
  },
  ...
}
```

Для взаимодействия с CGF-окнами необходимо зарегистрировать ресурсы в `res_map.json`.

## OpenWG.Gameface {#openwg-gameface}
[`OpenWG.Gameface`](https://gitlab.com/openwg/wot.gameface) — это специальный мод, который позволяет упростить регистрацию своих ресурсов в `res_map.json` и предоставляет дополнительные возможности для работы с окнами `CGF`. 

Процесс регистрации состоит из перезаписи (путём помещения в папку `res_mods`) файла `res_map.json`, в котором дописываются новые ресурсы и последующим автоматическим перезапуском игры, который нужен только если файл был изменён (например установлен новый мод).

### Пример регистрации ресурсов {#resource-registration}

В пакете мода необходимо создать файл `mods/configs/res_map/*.json` в котором описать используемые ресурсы.

```json [mods/configs/res_map/my_mod.json]
[
  {
    "itemID": "mods/testDialog/title",
    "type": "String",
    "parameters": {
      "key": "Dialog window made with Unbound (WULF)",
      "textdomain": "dialogs",
      "extension": ""
    }
  },
  {
    "itemID": "mods/testTooltip/layoutID",
    "type": "Layout",
    "path": "coui://gui/gameface/mods/testTooltip/TestTooltip.html",
    "parameters": {
      "extension": "",
      "entrance": "TestTooltip",
      "impl": "gameface"
    }
  }
]
```

После чего, в `Python`-коде можно получить доступ к этим ресурсам через `ModDynAccessor`:

```python [my_mod.py]
from openwg_gameface import ModDynAccessor

title = ModDynAccessor('mods/testDialog/title')
```

Или из `JavaScript`-кода окна `CGF`:

```javascript [my_mod.js]
const title = R.dialogs.title;
```
> TODO: Проверить такой ли путь
