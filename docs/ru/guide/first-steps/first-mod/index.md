# Первый реальный мод {#first-real-mod}

В этом руководстве мы пройдём все этапы создания реального Python-мода, в качестве примера, будет повторён мод [Быстрый демонтаж оборудования 2.0](http://forum.tanki.su/index.php?/topic/2204705-13700-quick-demount-20-быстрый-демонтаж-оборудования-20/). Будут разобраны не только шаги, которые необходимы для разработки мода, но и объяснен принцип, как до этих шагов нужно догадаться.

Этот мод позволяет быстро демонтировать оборудование с танка находясь в меню установки оборудования на другой танк.

![hero](./assets/hero.png)

Мод является крайне полезным и не очень сложным в разработке, что делает его отличным примером для изучения.

## Философия {#philosophy}

Основной подход к разработке модов для игры заключается в подмене существующих методов на свои реализации.

Благодаря языку Python и его динамическим возможностям, мы можем в рантайме (во время работы программы) заменить любой метод на свой, добавив туда нужную нам логику.

Например
```python
# сохраним оригинальный метод
original_method = SomeClass.some_method

# определим свою реализацию
def my_method(self, *a, **k):
  # тут может быть любая наша логика
  ...
  # вызовем оригинальный метод
  return original_method(self, *a, **k)

# заменим метод на наш
SomeClass.some_method = my_method

```

После такой замены, когда игра вызовет `SomeClass().some_method()`, на самом деле будет вызвана наша реализация `my_method`, в которой мы можем делать всё что угодно, а в нужный момент вызвать оригинальный метод.

## Идея мода {#mod-idea}

Перед разработкой мода, нужно чётко понимать, что именно он должен делать.
В нашем случае, мод должен из меню установки оборудования на танк позволять демонтировать оборудование с других танков.

Когда понятно что должен делать мод, нужно понять **как** он это будет делать.

## Шаги для реализации {#implementation-steps}

Перед разработкой полноценного мода имеет смысл разбить задачу на мелкие шаги и попробовать каждый из них через `PjOrion`.

- Понять, как отобразить интерфейс для выбора танка, с которого нужно демонтировать оборудование
- Понять, как получить список танков с установленным оборудованием
- Научиться вызывать демонтирование оборудования программно, с танка который не выбран в данный момент

## Интерфейс цели демонтажа {#demount-target-ui}
Первое что приходит в голову, это добавить кнопку "Демонтаж" рядом с кнопкой "Установить" в окне установки оборудования. Однако, интерфейс выбора оборудования сделан на `CGF`, который крайне тяжело поддаётся модификации.

::: details Как понять на чём сделан интерфейс
Отличить CGF интерфейс можно достаточно просто, необходимо в файле `res/packages/gui-part.pkg/gui/gameface/styles/default.css` добавить в конце файла следующий стиль:
```css [default.css]
* {
    border: 1px solid rgba(30, 247, 70, 0.4);
}
```

Он добавит зелёную рамку ко всем элементам CGF интерфейса, что позволит понять какие элементы игры к нему относятся.

Учтите, что пакет `gui-part.pkg` может быть разбит на несколько архивов, нужный файл `default.css` может находиться в любом из них.

В результате весь интерфейс демонтажа это CGF
![cgf-border](./assets/cgf-interface.webp)
:::

Поэтому, наиболее простой способ отображения интерфейса выбора танка для демонтажа, будет модифицировать существующие контекстное меню.

### Как найти контекстное меню {#find-context-menu}
Контекстно меню в игре вызывается через `Python` и обычно объявляется контролирующий класс, который наследуется от `AbstractContextMenuHandler`.

Попробуем найти в исходном коде игры контекстное меню для слота оборудования. Скоре всего, в названии контролирующего класса будет слово `ContextMenu`, и можно предположить, что в название будет слово `Equipment`, так как это меню для слота оборудования.

Воспользуемся поиском в VSCode по регулярному выражению `class .*Equipment.*ContextMenu`, здесь `.*` означает любое число произвольных символов.

::: details Результат поиска по регулярному выражению
![search-result](./assets/search-result.png)
:::

::: tip Совет
Учтите, что поиск по регулярномым выражением нужно включить кнопкой `.*` рядом с полем ввода.

Если вы используете `Git` и у вас есть `.gitignore` файл, то по умолчанию поиск не будет проходить по игнорируемым файлам. Чтобы искать везде, нудно нажать на `...` рядом с полем ввода в разделе `files to exclude` отменить выбор `Use Exclude Settings and Ignore Files`.
:::

Первый же результат поиска приводит к классу `BaseEquipmentItemContextMenu`, который находится по пути `.../tank_setup/context_menu/base_equipment.py`, где `tank_setup` явно говорит нам об успешном результате и что это именно то контекстное меню, которое нам нужно.

Префикс `Base` в названии класса говорит о том, что это базовый класс, от которого наследуются другие классы. Посмотрим, кто наследуется от него. Введём в поиск `class .*\(BaseEquipmentItemContextMenu`
::: details Результат поиска наследников `BaseEquipmentItemContextMenu`
![search-child-cm](./assets/search-child-cm.png)
:::
Нашлось три класса:
- `BattleAbilityItemContextMenu` – что то связанное с боевыми умениями
- `ConsumableItemContextMenu` – что то связанное с расходниками
- `OptDeviceItemContextMenu` – то что нам нужно


### Как модифицировать контекстное меню {#modify-context-menu}

Класс `OptDeviceItemContextMenu` реализует контекстное меню декларативным способом (подробнее в [как создать контекстное меню](/articles/how-to-create-context-menu/#high-level-way)) через наследование от `ContextMenu` и декоратор `@option`. Такой способ хорошо подходит для фиксированного числа кнопок, однако у нас число танков для демонтажа может меняться от оборудования к оборудованию, поэтому нам нужно использовать императивный подход через переопределение базовой фукнции `_generateOptions`

Эта функция определена в прородителе класса `OptDeviceItemContextMenu` -> `BaseEquipmentItemContextMenu` -> `BaseItemContextMenu` -> `BaseTankSetupContextMenu` -> `ContextMenu` -> `AbstractContextMenuHandler`

Проверим так ли это через `PjOrion`. Дня начала сохраним оригинальный метод
```python [PjOrion]
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import OptDeviceItemContextMenu
orig_generateOptions = OptDeviceItemContextMenu._generateOptions

print('Original _generateOptions:', orig_generateOptions)
```
После выполнения кода в консоли `PjOrion`, мы увидим что оригинальный метод действительно найден.
```
*** ('Original _generateOptions:', <unbound method OptDeviceItemContextMenu._generateOptions>)
```
::: warning Важно
После выполнения кода обязательно сотрите или закомментируйте сохранение, чтобы случайно не перезаписать `orig_generateOptions` в дальнейшем.
:::

Теперь мы можем попробовать переопределить `OptDeviceItemContextMenu._generateOptions` на свою реализацию, для начала просто выведем в консоль что мы туда попали. Внутри новой функции нужно вернуть результат оригинального метода `orig_generateOptions`, чтобы не сломать существующую логику.

```python [PjOrion]
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import OptDeviceItemContextMenu
#orig_generateOptions = OptDeviceItemContextMenu._generateOptions

def new_generateOptions(obj, *a, **k):
    print('new generate options')
    return orig_generateOptions(obj, *a, **k)

OptDeviceItemContextMenu._generateOptions = new_generateOptions
```

После выполнения кода, при открытии контекстного меню на варианте оборудования, в консоли `PjOrion` появится сообщение `new generate options`, что говорит о том, что мы успешно переопределили метод, и что он действительно вызывается в момент создания нужного контекстного меню.

#### Добавление своих пунктов меню {#add-custom-menu-items}

Теперь можно посмотреть что именно возвращает оригинальный метод, для этого выведем его результат в консоль.

```python [PjOrion]
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import OptDeviceItemContextMenu
#orig_generateOptions = OptDeviceItemContextMenu._generateOptions

def new_generateOptions(obj, *a, **k):
    orig_result = orig_generateOptions(obj, *a, **k)
    print('new generate options', orig_result)
    return orig_result

OptDeviceItemContextMenu._generateOptions = new_generateOptions
```

После вызова контекстного меню, получим массив с элементами меню
```python
[
  {'submenu': None, 'linkage': None, ..., label: 'Информация' },
  {'submenu': None, 'linkage': None, ..., label: 'Поместить в слот 1' },
  ....
]
```

Для нашей реализации, нам нужно в конец списка подменю `Демонтировать с другого танка`, в котором будет печеречисление танков с установленным оборудованием. Пока добавим подменю из трёх тестовых танков.

```python [PjOrion]
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import OptDeviceItemContextMenu
#orig_generateOptions = OptDeviceItemContextMenu._generateOptions

def new_generateOptions(obj, *a, **k):
    orig_result = orig_generateOptions(obj, *a, **k)

    submenuItems = [
        obj._makeItem('demountFrom:veh_1', 'Tank 1'),
        obj._makeItem('demountFrom:veh_2', 'Tank 2'),
        obj._makeItem('demountFrom:veh_3', 'Tank 3')
    ]

    orig_result.append(obj._makeSeparator()) # разделитель
    orig_result.append(obj._makeItem('demount', 'Demount from:', optSubMenu=submenuItems))
    return orig_result

OptDeviceItemContextMenu._generateOptions = new_generateOptions
```

Готово, теперь в контекстом меню есть пункт `Demount from:`, при нажатие на который появляется подменю с тремя танками.

#### Определение действий по нажатию на пункты меню {#handle-menu-actions}

Первым аргументом в `obj._makeItem` идёт уникальный идентификатор пункта меню (`optionId`), по которому мы сможем понять на какую кнопку нажали.

Для этого в самом базовом классе `AbstractContextMenuHandler` есть метод `onOptionSelect(optionId)`, который вызывается при нажатии на любой пункт меню, и в него передаётся этот самый идентификатор.

Сохраним его известным способом, после чего закомментируем сохранение, чтобы не перезаписать его случайно в дальнейшем.
```python [PjOrion]
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import OptDeviceItemContextMenu
orig_onOptionSelect = OptDeviceItemContextMenu.onOptionSelect
```

Теперь определим свою реализацию, в которой мы будем обрабатывать наши пункты меню.
```python [PjOrion]
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import OptDeviceItemContextMenu
#orig_onOptionSelect = OptDeviceItemContextMenu.onOptionSelect

def new_onOptionSelect(obj, optionId):
    if optionId.startswith('demountFrom:'):
        veh_id = optionId.split(':')[1]
        print('Demount from vehicle:', veh_id)
        # тут будет логика демонтажа с танка veh_id
        return
    return orig_onOptionSelect(obj, optionId)

OptDeviceItemContextMenu.onOptionSelect = new_onOptionSelect
```

Готово, теперь при нажатии на пункты меню `Tank 1`, `Tank 2`, `Tank 3` в консоли `PjOrion` будет выводиться сообщение с идентификатором танка.

![demount-log](./assets/demount-log.png)



## Получение списка танков с оборудованием {#get-tanks-with-equipment}
Теперь, когда мы умеем добавлять свои пункты меню и обрабатывать нажатия на них, нужно научиться получать список танков с установленным оборудованием.

Однако, для начала нужно понять, какое именно оборудование мы хотим демонтировать. Скорее всего, эта информация и так есть в `OptDeviceItemContextMenu`, однако, нужно понять где именно.

### Исследуем OptDeviceItemContextMenu {#explore-game-objects}
Для этого, модифицируем наш `new_generateOptions`, чтобы вывести объект `obj` в глобальную область видимости `PjOrion`, чтобы можно было его исследовать.

```python [PjOrion]
def new_generateOptionsSaveObj(obj, *a, **k):
    global last_OptDeviceItemContextMenu
    last_OptDeviceItemContextMenu = obj
    return orig_generateOptions(obj, *a, **k)
    
OptDeviceItemContextMenu._generateOptions = new_generateOptionsSaveObj
```

После вызова контекстного меню, в `PjOrion` появится глобальная переменная `last_OptDeviceItemContextMenu`, которая содержит объект `OptDeviceItemContextMenu`.

Теперь можно исследовать его, по нажатию ПКМ (правой кнопкой мыши) после `last_OptDeviceItemContextMenu.` в окне ввода кода `PjOrion`, можно выбрать `Show attributes` и увидеть все его атрибуты.
![last-opt-attributes](./assets/last-opt-attributes.png)

Среди атрибутов есть метод `_getItem`, попробуем вывести его в консоль с помощью `print(last_OptDeviceItemContextMenu._getItem())`, в результате получим объект `OptionalDevice`:
```
OptionalDevice<intCD:23801, type:optionalDevice, nation:15>
```

Дальнейшее проставление символа `.` после `last_OptDeviceItemContextMenu._getItem()` и выбор `Show attributes` покажет все атрибуты объекта `OptionalDevice`. Одним из которых будет `getInstalledVehicles`, который по названию явно говорит о том, что он возвращает список танков с установленным оборудованием.

При попытке вызвать `last_OptDeviceItemContextMenu._getItem().getInstalledVehicles()` в консоли `PjOrion`, мы получим ошибку, что метод требует **два аргумента**, а мы передаём только одни.

### Понимание getInstalledVehicles {#understand-get-installed-vehicles}
Воспользовшись поиском по `getInstalledVehicles` можно найти множество примеров, где этот метод вызывается с двумя аргументами, первым из которых является `self`, а вторым `vehicles` (массив танков).

Например в `InventoryBlockConstructor`:
```python [PjOrion]
...
def _getInstalledVehicles(self, module, inventoryVehicles):
    return module.getInstalledVehicles(inventoryVehicles.itervalues())
...
items = self.itemsCache.items
inventoryVehicles = items.getVehicles(REQ_CRITERIA.INVENTORY)
installedVehicles = self._getInstalledVehicles(module, inventoryVehicles)
...
```

Попробуем сделать так же, для этого получим список всех танков в ангаре с помощью `itemsCache`:
```python [PjOrion]
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from gui.shared.utils.requesters import REQ_CRITERIA

itemsCache = dependency.instance(IItemsCache) # type: IItemsCache
inventoryVehicles = itemsCache.items.getVehicles(REQ_CRITERIA.INVENTORY)
print(last_OptDeviceItemContextMenu._getItem().getInstalledVehicles(inventoryVehicles.itervalues()))
```

::: tip Совет
Как работать с `dependency` и `IItemsCache` можно почитать в статье [Как работать с Dependency Injections](/articles/how-to-work-with-di/)
:::

В результате в консоли `PjOrion` появится сет танков с установленным оборудованием.
```
set([
    Vehicle<id:548, intCD:62241, nation:2, lock:(0, 0)>,
    ...
    Vehicle<id:516, intCD:6977, nation:4, lock:(0, 0)>
])
```

Преобразуем его в массив (`intCD`, `name`) и выведем в консоль.
```python [PjOrion]
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from gui.shared.utils.requesters import REQ_CRITERIA

itemsCache = dependency.instance(IItemsCache) # type: IItemsCache
inventoryVehicles = itemsCache.items.getVehicles(REQ_CRITERIA.INVENTORY)
installedVehicles = last_OptDeviceItemContextMenu._getItem().getInstalledVehicles(inventoryVehicles.itervalues())
print([(v.intCD, v.userName) for v in installedVehicles])x
```

В игре `intCD` это уникальный идентификатор танка, а `shortUserName` это короткое название танка.
> В консоли `PjOrion` русские буквы отображаются как их Unicode коды, но в игре всё будет работать нормально.

### Обновление контекстного меню {#update-context-menu}
Обновим контекстное меню, чтобы оно показывало реальные танки с установленным оборудованием.

```python [PjOrion]
itemsCache = dependency.instance(IItemsCache) # type: IItemsCache
inventoryVehicles = itemsCache.items.getVehicles(REQ_CRITERIA.INVENTORY)

def new_generateOptionsRealVehicles(obj, *a, **k):
    original_result = orig_generateOptions(obj, *a, **k)

    installedVehicles = obj._getItem().getInstalledVehicles(inventoryVehicles.itervalues())
    
    submenuItems = [
        obj._makeItem('demountFrom:%d' % v.intCD, v.userName) for v in installedVehicles
    ]
    
    original_result.append(obj._makeSeparator())
    original_result.append(obj._makeItem('demount', 'Demount from:', optSubMenu=submenuItems))
    return original_result
    
OptDeviceItemContextMenu._generateOptions = new_generateOptionsRealVehicles
```
![demount-real-log](./assets/demount-real-log.png)

## Вызов демонтажа оборудования {#call-demount-equipment}
Остался последний шаг, нужно научиться программно демонтировать оборудование с танка, который не выбран в данный момент.

В игре, демонтаж оборудования происходит с помощью `CGF` кнопки, однако, найти что она вызывает может быть проблематично. Можно было бы попробовать через поиск по `demount`, но в игре есть много чего связанного с демонтажом, и найти именно то что нужно может быть сложно.

### Поиск демонтажа по контекстному меню {#find-demount-by-context-menu}
Можно вспомнить, что демонтировать оборудование можно из контекстного меню в ангаре:
![demount-from-hangar](./assets/demount-from-hangar.png){width=400}

Можно было бы поискать другие `...OptDevice...ContextMenu`, но нам повезло, и `HangarOptDeviceSlotContextMenu` находится прямо рядом с `OptDeviceItemContextMenu`, в том же файле `.../tank_setup/context_menu/opt_device.py`.

В этом классе объявляется опция `demountFromSetup`, который вызывает метод `_demountProcess`, который и занимается демонтажом оборудования.

```python [opt_device.py]
from gui.shared.gui_items.items_actions import factory as ActionsFactory

@option(_sqGen.next(), TankSetupCMLabel.DEMOUNT_FROM_SETUP)
def demountFromSetup(self):
    self._demountProcess(isDestroy=False, everywhere=False)
    
@adisp_process
def _demountProcess(self, isDestroy=False, everywhere=True):
    item = self._itemsCache.items.getItemByCD(self._intCD)
    action = ActionsFactory.getAction(
        ActionsFactory.REMOVE_OPT_DEVICE,
        self._getVehicle(),
        item,
        self._installedSlotId,
        isDestroy,
        forFitting=False,
        everywhere=everywhere
    )
    result = yield ActionsFactory.asyncDoAction(action)
    ...
```

::: tip Совет
Как работать с `adisp_process` можно почитать в статье [Асинхронное программирование](/articles/adisp/)
:::

Как видно из кода, нам необходимо вызвать действие `REMOVE_OPT_DEVICE` с помощью `ActionsFactory`. В которое нужно передать:
- танк, с которого нужно демонтировать оборудование (объект `self._getVehicle()`)
- оборудование, которое нужно демонтировать (объект `self._itemsCache.items.getItemByCD(self._intCD)`)
- id слота, с которого нужно демонтировать оборудование (`self._installedSlotId`)

Как получить танк и оборудование мы уже знаем, осталось понять как получить id слота.

### Понимание id слота {#understand-slot-id}
Что именно это за id не очень понятно, в этом случае можно попробовать переопределить метод `_demountProcess` и вывести в консоль что находится в нужных паратметрах.

Сохраняем оригинальный метод
```python [PjOrion]
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import HangarOptDeviceSlotContextMenu
orig_demountProcess = HangarOptDeviceSlotContextMenu._demountProcess
```
Переопределяем его
```python [PjOrion]
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import HangarOptDeviceSlotContextMenu
#orig_demountProcess = HangarOptDeviceSlotContextMenu._demountProcess

def new_demountProcess(obj, *a, **k):
    item = obj._itemsCache.items.getItemByCD(obj._intCD)
    print('OnDemount:', obj._getVehicle(), item, obj._installedSlotId)
    
    return orig_demountProcess(obj, *a, **k)

HangarOptDeviceSlotContextMenu._demountProcess = new_demountProcess
```

После этого, можно поэкспериментировать с демонтажом оборудования из контекстного меню в ангаре, в том числе из разных комплектов оборудования, чтобы понять что именно приходит в `self._installedSlotId`.
В результате, можно понять, что `self._installedSlotId` это просто порядковый номер слота, начиная с нуля, в том числе и в дополнительном комплекте оборудования.

### Пробуем демонтировать {#try-demount}
Теперь, когда мы поняли что нужно передавать в `ActionsFactory.getAction`, можно реализовать демонтаж оборудования с выбранного танка.

Нам понадобится `intCD` танка и `intCD` оборудования, которое мы хотим демонтировать. Воспользуемся текущей техникой в ангаре (`g_currentVehicle`) и получим её `intCD` и оборудование из второго слота
```python [PjOrion]
from CurrentVehicle import g_currentVehicle
print(g_currentVehicle.intCD)
print(g_currentVehicle.item.optDevices.installed[1].intCD)
```

::: tip Совет
Подробнее исследовать что есть в `g_currentVehicle` можно через `PjOrion` изучая подсказки по нажатию `.`.
:::

В моём случае:
- `intCD` техники `4737` (Strv 103B)
- `intCD` оборудования `25593` (Турбонагнетатель)
- `id` слота `1` (второй слот, так как нумерация с нуля)

Вызовем демонтаж, как в примере из `HangarOptDeviceSlotContextMenu._demountProcess`, но с нашими параметрами.
```python [PjOrion]
from gui.shared.gui_items.items_actions import factory as ActionsFactory
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from adisp import adisp_process

@adisp_process
def demount(vehicleCD, deviceCD, slotId):
    itemsCache = dependency.instance(IItemsCache) # type: IItemsCache
    item = itemsCache.items.getItemByCD(deviceCD)
    vehicle = itemsCache.items.getItemByCD(vehicleCD)
    
    action = ActionsFactory.getAction(
        ActionsFactory.REMOVE_OPT_DEVICE,
        vehicle,
        item,
        slotId,
        False,
        forFitting=False,
        everywhere=True
    )
    result = yield ActionsFactory.asyncDoAction(action)

demount(4737, 25593, 1) # подставьте свои значения
```

::: details Результат
![demount-frozen-screen](./assets/demount-frozen-screen.png)
:::


В результате получаем зависший экран с размытием. Такое бывает. В данном случае, поможет `ESC` -> `Сменить сервер`, что полностью перезагрузит интерфейс ангара. Иногда может понадобиться полная перезагрузка игры.

Когда код написан точно правильно, вы его несколько раз проверили, а он всё равно не работает, то проблема может быть в способе запуска. В данном случае в `PjOrion`, скорее всего, код запускается не в главном потоке, и интерфейс не может проинициализироваться.

Можно принудительно запустить код в главном потоке с помощью трюка с `BigWorld.callback(time, callback)`, этот механизм используется что бы отложить запуск функции на указанное время, при этом запуск происходит от имени движка в главном потоке.

```python [PjOrion]
BigWorld.callback(0, lambda: demount(4737, 25593, 1))
```
::: details Результат
![demount-succes-screen](./assets/demount-succes-screen.png)
:::

Действительно, теперь всё работает как надо, в том числе если выбрать в ангаре другой танк.

### Получение индекса слота {#get-slot-id}
Остаётся научиться автоматически определять `slotId` по оборудованию и танку.
В теории это делается легко с помощью перебора `optDevices.installed` как мы делали в пошлом разделе для `g_currentVehicle`
```python [PjOrion]
from helpers import dependency
from skeletons.gui.shared import IItemsCache

def getInstalledSlotIdx(vehicleCD, moduleIntCD):
    itemsCache = dependency.instance(IItemsCache) # type: IItemsCache
    vehicle = itemsCache.items.getItemByCD(vehicleCD)
    for idx, op in enumerate(vehicle.optDevices.installed):
        if op is not None and moduleIntCD == op.intCD:
            return idx
    return -1
    
print(getInstalledSlotIdx(4737, 25593)) # подставьте свои значения
```
Этот способ работает, но есть нюанс, если оборудование установлено в дополнительный комплект, то оно не будет найдено. И в игре в принципе нет возможности получить список оборудования из дополнительного комплекта, кроме как явно переключить комплект.

У `ActionsFactory` которую мы используем для демонтажа, есть и другие действия которые можно изучить и найти `CHANGE_SETUP_EQUIPMENTS_INDEX`. Теперь можно выполнить поиск по проекту и найти где оно используется.

Например в классе `LoadoutPresenter` по пути `.../lobby/hangar/presenters/loadout_presenter.py`, в котором есть метод `__doChangeSetupIndex`, который и вызывает нужное нам действие.

```python [loadout_presenter.py]
@adisp.adisp_process
def __doChangeSetupIndex(self, groupId, currentIndex):
    action = ActionsFactory.getAction(
        ActionsFactory.CHANGE_SETUP_EQUIPMENTS_INDEX,
        self.__getVehicle(),
        groupId,
        currentIndex
    demountFromSetup, который вызывает)
    ...
```

Применим это знание к нашей функции `getInstalledSlotIdx`, чтобы она могла находить оборудование в любом комплекте.

```python [PjOrion]
from adisp import adisp_process, adisp_async
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from post_progression_common import TankSetupGroupsId
from gui.shared.gui_items.items_actions import factory as ActionsFactory


@adisp_async
@adisp_process
def getInstalledSlotIdx(vehicleCD, moduleIntCD, callback):
    itemsCache = dependency.instance(IItemsCache) # type: IItemsCache
    
    def checkDevices():
        vehicle = itemsCache.items.getItemByCD(vehicleCD)
        for idx, op in enumerate(vehicle.optDevices.installed):
            if op is not None and moduleIntCD == op.intCD:
                callback(idx)
                return True
        return False

    # Проверяем текущий комплект
    if checkDevices(): return

    # Меняем комплект на противоположный
    vehicle = itemsCache.items.getItemByCD(vehicleCD)
    targetIndex = 1 if vehicle.optDevices.setupLayouts.layoutIndex == 0 else 0
    action = ActionsFactory.getAction(
        ActionsFactory.CHANGE_SETUP_EQUIPMENTS_INDEX,
        vehicle,
        TankSetupGroupsId.OPTIONAL_DEVICES_AND_BOOSTERS,
        targetIndex
    )
    # Дожидаемся смены
    result = yield ActionsFactory.asyncDoAction(action)
    
    # Проверяем новый текущий комплект
    if checkDevices(): return
    
    # Ничего не нашли
    callback(-1)

@adisp_process
def getSlot():
    res = yield getInstalledSlotIdx(4737, 25593) # подставьте свои значения
    print(res)

getSlot()
```

::: details Откуда взялся `TankSetupGroupsId`
Все примеры использования `CHANGE_SETUP_EQUIPMENTS_INDEX` в проекте получают `groupId` аргументом, можно переопределить метод и посмотреть, что именно за значение туда передаётся. На практике это будет `2` при переключении комплекта оборудования и `1` при переключении комплекта снарядов.

В том же самом файле `loadout_presenter.py` есть функция `def _getEquipmentsPairs(self, groupID))` которая принимает `groupID` и обрабатывает его значения.

```python [loadout_presenter.py]
from post_progression_common import TankSetupGroupsId
...
def _getEquipmentsPairs(self, groupID):
    ...
    if groupID == TankSetupGroupsId.EQUIPMENT_AND_SHELLS:
    elif groupID == TankSetupGroupsId.OPTIONAL_DEVICES_AND_BOOSTERS:
    ...
```
От сюда и можно взять нужное значение `TankSetupGroupsId.OPTIONAL_DEVICES_AND_BOOSTERS`, которое как раз равно `2`.
:::

## Реализация мода {#mod-implementation}
Теперь, когда мы научились делать каждый шаг по отдельности, можно собрать всё вместе и сделать полноценный мод.

Будем делать на основе `my.first_mod` из обучения по [настройке Python окружения](../environment/python/). Весь функционал разобьём на разные файлы, чтобы было проще ориентироваться в коде.


### Логика демонтажа {#demount-logic}
Вынесем `itemsCache` на уровень модуля, чтобы не получать его каждый раз заново. А в функции `demount` будем получать `slotId` с помощью `getInstalledSlotIdx`, а затем вызывать демонтаж.

```python [my_first_mod/demount.py]
from adisp import adisp_process, adisp_async
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from post_progression_common import TankSetupGroupsId
from gui.shared.gui_items.items_actions import factory as ActionsFactory

itemsCache = dependency.instance(IItemsCache) # type: IItemsCache

@adisp_async
@adisp_process
def getInstalledSlotIdx(vehicleCD, moduleIntCD, callback):

    def checkDevices():
        vehicle = itemsCache.items.getItemByCD(vehicleCD)
        for idx, op in enumerate(vehicle.optDevices.installed):
            if op is not None and moduleIntCD == op.intCD:
                callback(idx)
                return True
        return False

    # Проверяем текущий комплект
    if checkDevices(): return

    # Меняем комплект на противоположный
    vehicle = itemsCache.items.getItemByCD(vehicleCD)
    targetIndex = 1 if vehicle.optDevices.setupLayouts.layoutIndex == 0 else 0
    action = ActionsFactory.getAction(
        ActionsFactory.CHANGE_SETUP_EQUIPMENTS_INDEX,
        vehicle,
        TankSetupGroupsId.OPTIONAL_DEVICES_AND_BOOSTERS,
        targetIndex
    )
    # Дожидаемся смены
    result = yield ActionsFactory.asyncDoAction(action)
    
    # Проверяем новый текущий комплект
    if checkDevices(): return
    
    # Ничего не нашли
    callback(-1)


@adisp_process
def demount(vehicleCD, deviceCD):
    item = itemsCache.items.getItemByCD(deviceCD)
    vehicle = itemsCache.items.getItemByCD(vehicleCD)

    slotId = yield getInstalledSlotIdx(vehicleCD, deviceCD)
    if slotId == -1:
        print('Device not found on vehicle')
        return
    
    action = ActionsFactory.getAction(
        ActionsFactory.REMOVE_OPT_DEVICE,
        vehicle,
        item,
        slotId,
        False,
        forFitting=False,
        everywhere=True
    )
    result = yield ActionsFactory.asyncDoAction(action)
```

### Контекстное меню {#context-menu}

Переопределение логики контекстного меню вынесем в отдельный файл `contextMenuOverride.py`, в котором будем переопределять методы `_generateOptions` и `onOptionSelect`. Из `onOptionSelect` мы будем вызывать `demount` из нашего модуля `demount.py`.

```python [my_first_mod/contextMenuOverride.py]
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import OptDeviceItemContextMenu

from .demount import demount

itemsCache = dependency.instance(IItemsCache) # type: IItemsCache

# ==== Переопределение _generateOptions ====
orig_generateOptions = OptDeviceItemContextMenu._generateOptions

def new_generateOptionsRealVehicles(obj, *a, **k):
    original_result = orig_generateOptions(obj, *a, **k)

    inventoryVehicles = itemsCache.items.getVehicles(REQ_CRITERIA.INVENTORY)
    installedVehicles = obj._getItem().getInstalledVehicles(inventoryVehicles.itervalues())
    
    submenuItems = [
        obj._makeItem('demountFrom:%d' % v.intCD, v.userName) for v in installedVehicles
    ]
    
    if len(submenuItems) == 0: return original_result

    original_result.append(obj._makeSeparator())
    original_result.append(obj._makeItem('demount', 'Демонтировать с танка:', optSubMenu=submenuItems))
    return original_result
    
OptDeviceItemContextMenu._generateOptions = new_generateOptionsRealVehicles


# ==== Переопределение onOptionSelect ====
orig_onOptionSelect = OptDeviceItemContextMenu.onOptionSelect

def new_onOptionSelect(obj, optionId):
    if optionId.startswith('demountFrom:'):
        veh_id = optionId.split(':')[1]
        demount(int(veh_id), obj._getItem().intCD) # вызов демонтажа
        return

    return orig_onOptionSelect(obj, optionId)

OptDeviceItemContextMenu.onOptionSelect = new_onOptionSelect
```

### Инициализация мода {#mod-initialization}
Осталось только инициализировать наш мод, для этого в `my_first_mod.py` добавим импорт `contextMenuOverride.new_onOptionSelect`, просто чтобы инициализировать переопределение методов.

```python [my_first_mod.py]
from .my_first_mod.contextMenuOverride import new_onOptionSelect
```

## Результат {#result}
Готово, теперь можно скомпилировать мод и попробовать его в игре.

![final-result](./assets/final-result.png)

## Улучшения {#conclusion}
В результате вы получили рабочий мод, который позволяет демонтировать оборудование с других танков прямо из меню установки оборудования. При этом обучились работать с исходным кодом игры и узнали как проходит процесс разработки модификаций.

Разработанный мод можно улучшить, например:
- Добавить опцию для оптовой докупки оборудования, как в оригинальном моде (искать по `ActionsFactory.BUY_MODULE`)
- Если список танков большой, то его можно разбить на подменю по уровню техники
- Можно добавить настройку мода, которая позволит автоматически демонтировать оборудование без показа диалогового окна (`ActionsFactory.doAction(ActionsFactory.REMOVE_OPT_DEVICE, vehicle, item, slotId, skipConfirm = True`)