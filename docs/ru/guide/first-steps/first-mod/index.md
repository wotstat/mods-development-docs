# Первый реальный мод {#first-real-mod}

В этом руководстве мы пройдём все этапы создания реального Python-мода, в качестве примера, будет повторён мод [Быстрый демонтаж оборудования 2.0](http://forum.tanki.su/index.php?/topic/2204705-13700-quick-demount-20-быстрый-демонтаж-оборудования-20/).

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

Класс `OptDeviceItemContextMenu` реализует контекстное меню высокоуровневым способом (подробнее в [как создать контекстное меню](/articles/how-to-create-context-menu/#high-level-way)) через наследование от `ContextMenu` и декоратор `@option`. Такой способ хорошо подходит для фиксированного числа кнопок, однако у нас число танков для демонтажа может меняться от оборудования к оборудованию, поэтому нам нужно использовать низкоуровневый способ через переопределение базовой фукнции `_generateOptions`

Эта функция определена в прородителе класса `OptDeviceItemContextMenu` -> `BaseEquipmentItemContextMenu` -> `BaseItemContextMenu` -> `BaseTankSetupContextMenu` -> `ContextMenu` -> `AbstractContextMenuHandler`

Проверим так ли это через `PjOrion`. Дня начала сохраним оригинальный метод
```python
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

```python
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

```python
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

```python
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
```python
from gui.Scaleform.daapi.view.lobby.tank_setup.context_menu.opt_device import OptDeviceItemContextMenu
orig_onOptionSelect = OptDeviceItemContextMenu.onOptionSelect
```

Теперь определим свою реализацию, в которой мы будем обрабатывать наши пункты меню.
```python
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

```python
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
```python
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
```python
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
```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from gui.shared.utils.requesters import REQ_CRITERIA

itemsCache = dependency.instance(IItemsCache) # type: IItemsCache
inventoryVehicles = itemsCache.items.getVehicles(REQ_CRITERIA.INVENTORY)
installedVehicles = last_OptDeviceItemContextMenu._getItem().getInstalledVehicles(inventoryVehicles.itervalues())
print([(v.intCD, v.userName) for v in installedVehicles])
```

В игре `intCD` это уникальный идентификатор танка, а `shortUserName` это короткое название танка.
> В консоли `PjOrion` русские буквы отображаются как их Unicode коды, но в игре всё будет работать нормально.

### Обновление контекстного меню {#update-context-menu}
Обновим контекстное меню, чтобы оно показывало реальные танки с установленным оборудованием.

```python
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