---
title: How to Work with Dependency Injection
description: Using the dependency helper module and common game client interfaces in World Of Tanks mods.
---

# How to Work with Dependency Injections {#how-to-work-with-di}

Dependency Injection (DI) is a design pattern that simplifies how components manage their dependencies.

Often we have service classes needed across many places. The simplest approach is to create a global instance accessible everywhere.

For example the game uses a global like `g_eventBus`:
```python
from gui.shared import g_eventBus
```
But this approach has drawbacks: tight coupling, harder testing, and lifecycle management issues.

DI helps solve these problems.

## Injection {#injection}
To obtain a class instance the game uses the `helpers.dependency` module. Classes available via DI are defined by their interfaces, making it easy to swap implementations without changing consumer code.

One common interface is `IItemsCache`, providing access to player data, vehicles, crew, etc.

Ways to obtain an implementation:
- `@dependency.replace_none_kwargs` – replaces function kwargs
- `dependency.instance` – get an instance immediately
- `dependency.descriptor` – declare dependency as a class descriptor

If you have VSCode hints configured you should add type annotations so the editor knows the type (in this project via `# type: <type>` comments).

### @dependency.replace_none_kwargs
Automatically injects dependencies into function/method parameters if they weren’t passed explicitly.
```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache

@dependency.replace_none_kwargs(itemsCache=IItemsCache)
def demo(foo, bar, itemsCache=None):
    # type: (str, str, IItemsCache) -> None
    print(itemsCache)

demo('foo', 'bar')  # itemsCache will be injected automatically
```

### dependency.instance {#instance}
Get an instance immediately.
```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache

itemsCache = dependency.instance(IItemsCache) # type: IItemsCache
print(itemsCache)
```

### dependency.descriptor {#descriptor}
Declare a dependency as a class descriptor. It will be injected when an instance is created.

```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache

class Demo:
    itemsCache = dependency.descriptor(IItemsCache) # type: IItemsCache

    def showItemsCache(self):
        print(self.itemsCache)

demo = Demo()
```

## Useful Interfaces {#useful-interfaces}
Some useful interfaces for mod development:

::: tip TODO
Expand with details.
:::

### `IItemsCache` {#iitemscache}
Access to player stats, vehicles, crew, badges, achievements, etc.

```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache

itemsCache = dependency.instance(IItemsCache) # type: IItemsCache

print(itemsCache.items.stats)  # Player statistics
print(itemsCache.items.getVehicles())  # Player vehicles
```

### `IHangarSpace` {#ihangarspace}
Access to hangar space; subscribe to creation and destruction events.

```python
from helpers import dependency
from skeletons.gui.shared.utils import IHangarSpace

hangarSpace = dependency.instance(IHangarSpace) # type: IHangarSpace

hangarSpace.onSpaceCreate += lambda: print("Hangar created")
hangarSpace.onSpaceDestroy += lambda: print("Hangar destroyed")
hangarSpace.onVehicleChanged += lambda: print("Hangar vehicle changed")
```

### `IBattleSessionProvider` {#ibattlesessionprovider}
Access to battle data; subscribe to start/stop events.

```python
from helpers import dependency
from skeletons.gui.battle_session import IBattleSessionProvider

sessionProvider = dependency.instance(IBattleSessionProvider) # type: IBattleSessionProvider
sessionProvider.onBattleSessionStart += lambda: print("Battle started")
sessionProvider.onBattleSessionStop += lambda: print("Battle finished")

print(sessionProvider.isReplayPlaying)  # Check if a replay is currently playing
```

### `IEventsCache` {#ieventscache}
Access to events like clans, ranked battles.

```python
from helpers import dependency
from gui.server_events import IEventsCache

eventsCache = dependency.instance(IEventsCache) # type: IEventsCache

print(eventsCache.getAllQuests())  # All quests
print(eventsCache.getPersonalMissions())  # Personal missions
```

### `ILobbyContext` {#ilobbycontext}
???

```python
from helpers import dependency
from skeletons.gui.lobby_context import ILobbyContext

lobbyContext = dependency.instance(ILobbyContext) # type: ILobbyContext
```
