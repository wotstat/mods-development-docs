# Как работать с Dependency Injections {#how-to-work-with-di}

Dependency Injection (DI) — это шаблон проектирования, который позволяет упростить управление зависимостями между компонентами программы.

Часто бывает, что есть некоторые служебные класса, которые необходимы в большом количестве других классов. Самый простой способ реализации это создать глобальный экземпляр, который будет доступен отовсюду.

Например такой подход используется с `g_eventBus`
```python
from gui.shared import g_eventBus
```
Однако этот подход имеет множество недостатков, таких как жёсткая связь между классами, сложность тестирования и трудности в управлении жизненным циклом объектов.

Чтобы решить эти проблемы был придуман шаблон Dependency Injection.

## Инъекция зависимостей {#injection}
Что бы получить ссылку на класс, в игре используется `helpers.dependency` модуль. Классы которые можно получить через DI определяются через их интерфейсы, что позволяет легко заменять реализации классов без изменения кода, который их использует.

Одним из таких интерфейсов является распространённый `IItemsCache`, который предоставляет доступ к данным об игроке, его танках, экипаже и т.д.

Получить ссылку на реализацию интерфейса можно несколькими способами:
- @dependency.replace_none_kwargs – заменяет параметры функции
- dependency.instance – получить экземпляр здесь и сейчас
- dependency.descriptor – определить зависимость как дескриптор класса

### @dependency.replace_none_kwargs
Позволяет автоматически внедрять зависимости в параметры функции или метода, если они не были переданы явно.
```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache

@dependency.replace_none_kwargs(itemsCache=IItemsCache)
def demo(foo, bar, itemsCache=None):
    print(itemsCache)

demo('foo', 'bar')  # itemsCache будет автоматически внедрён
```

### dependency.instance
Позволяет получить экземпляр здесь и сейчас.
```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache

itemsCache = dependency.instance(IItemsCache)
print(itemsCache)
```

### dependency.descriptor
Позволяет определить зависимость как дескриптор класса. Зависимость будет автоматически внедрена при создании экземпляра класса.

```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache

class Demo:
    itemsCache = dependency.descriptor(IItemsCache)

    def showItemsCache(self):
        print(self.itemsCache)

demo = Demo()
```

## Полезные интерфейсы {#useful-interfaces}
Вот список некоторых полезных интерфейсов, которые могут пригодиться при разработке модов

::: tip TODO
Расписать подробнее
:::

### `IItemsCache` {#iitemscache}
Предоставляет доступ к данным об игроке, его танках, экипаже, бейджах, достижениях и т.д.

```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache

itemsCache = dependency.instance(IItemsCache)

print(itemsCache.items.stats)  # Доступ к статистике игрока
print(itemsCache.items.getVehicles())  # Доступ к танкам игрока
```

### `IHangarSpace` {#ihangarspace}
Предоставляет доступ к пространству ангара, позволяет подписываться на события создания и уничтож
ения пространства.

```python
from helpers import dependency
from skeletons.gui.shared.utils import IHangarSpace

hangarSpace = dependency.instance(IHangarSpace)

hangarSpace.onSpaceCreate += lambda: print("Ангар создан")
hangarSpace.onSpaceDestroy += lambda: print("Ангар уничтожен")
hangarSpace.onVehicleChanged += lambda: print("Танк в ангаре изменён")
```

### `IEventsCache` {#ieventscache}
Предоставляет доступ к данным о событиях, таких как кланы, рейтинговые б

```python
from helpers import dependency
from gui.server_events import IEventsCache

eventsCache = dependency.instance(IEventsCache)

print(eventsCache.getAllQuests())  # Доступ ко всем задачам
print(eventsCache.getPersonalMissions())  # Доступ к ЛБЗ
```


### `ILobbyContext` {#ilobbycontext}
???

```python
from helpers import dependency
from skeletons.gui.lobby_context import ILobbyContext

lobbyContext = dependency.instance(ILobbyContext)
```
