# Очередь в бой {#battle-queue-api}

Мир Танков использует систему **Prebattle Control** (`gui/prb_control/`) для управления очередями в бой.

## Ключевые компоненты {#key-components}

| Компонент              | Путь                                                  | Назначение                                |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------- |
| `_PreBattleDispatcher` | `gui/prb_control/dispatcher.py`                       | Главный диспетчер всех prebattle действий |
| `PreQueueEntity`       | `gui/prb_control/entities/base/pre_queue/entity.py`   | Базовый класс для очередей                |
| `RandomEntity`         | `gui/prb_control/entities/random/pre_queue/entity.py` | Очередь случайных боёв                    |
| `PlayerAccount`        | `Account.py`                                          | Низкоуровневые методы очереди             |

## Типы очередей {#queue-types}

```python
from constants import QUEUE_TYPE

QUEUE_TYPE.RANDOMS        # Случайные бои
QUEUE_TYPE.RANKED         # Ранговые бои (15x15)
QUEUE_TYPE.COMP7          # Натиск (7x7)
QUEUE_TYPE.EPIC           # Линия фронта
QUEUE_TYPE.BATTLE_ROYALE  # Стальной охотник
QUEUE_TYPE.MAPBOX         # Mapbox
QUEUE_TYPE.BOOTCAMP       # Обучение
```

## Высокоуровневый API: Prebattle Dispatcher {#high-level-api}

```python
from gui.prb_control.dispatcher import g_prbLoader
from gui.prb_control.settings import PREBATTLE_ACTION_NAME

def startRandomBattle():
    """Встать в очередь случайного боя"""
    dispatcher = g_prbLoader.getDispatcher()
    if dispatcher:
        # doAction() ставит в очередь или выходит из неё
        dispatcher.doAction()

def selectBattleMode(modeName):
    """Выбрать режим боя"""
    # modeName: 'random', 'ranked', 'comp7', etc.
    from gui.prb_control.entities.base.ctx import PrbAction
    dispatcher = g_prbLoader.getDispatcher()
    if dispatcher:
        action = PrbAction(modeName)
        dispatcher.doSelectAction(action)
```

## Низкоуровневый API: Account {#low-level-api}

```python
import BigWorld

def enqueueRandomBattle(vehicleInvID, gameplaysMask=255):
    """
    Встать в очередь случайного боя напрямую.
    
    :param vehicleInvID: ID танка в инвентаре (g_currentVehicle.invID)
    :param gameplaysMask: Битовая маска режимов игры
    """
    player = BigWorld.player()
    if player:
        player.enqueueRandom(vehicleInvID, gameplaysMask=gameplaysMask)

def dequeueFromBattle():
    """Выйти из очереди"""
    player = BigWorld.player()
    if player:
        player.dequeueRandom()
```

## Методы очереди на Account {#account-queue-methods}

```python
# Случайные бои
player.enqueueRandom(vehInvID, gameplaysMask, arenaTypeID, randomFlags)
player.dequeueRandom()

# Ранговые бои
player.enqueueRanked(vehInvID)
player.dequeueRanked()

# Натиск (Comp7)
player.enqueueComp7(vehInvID)
player.dequeueComp7()

# Линия фронта
player.enqueueEpic(vehInvID)
player.dequeueEpic()

# Стальной охотник
player.enqueueBattleRoyale(vehInvID)
player.dequeueBattleRoyale()

# Mapbox
player.enqueueMapbox(vehInvID)
player.dequeueMapbox()
```

## Получение Inventory ID танка {#get-vehicle-inv-id}

```python
from CurrentVehicle import g_currentVehicle

def getCurrentVehicleInvID():
    """Получить inventory ID текущего танка"""
    if g_currentVehicle.isPresent():
        return g_currentVehicle.invID
    return None
```

## События очереди {#queue-events}

```python
from PlayerEvents import g_playerEvents

# Подписка на события очереди
g_playerEvents.onEnqueued += onEnqueued           # Успешно встали в очередь
g_playerEvents.onDequeued += onDequeued           # Вышли из очереди
g_playerEvents.onEnqueueFailure += onEnqueueError # Ошибка постановки в очередь
g_playerEvents.onKickedFromQueue += onKicked      # Выкинуло из очереди
g_playerEvents.onArenaCreated += onArenaCreated   # Бой найден, загрузка арены

def onEnqueued(queueType, *args):
    print("Встали в очередь: %s" % queueType)

def onArenaCreated():
    print("Бой найден!")
```

## Параметры enqueueRandom {#enqueue-random-params}

```python
player.enqueueRandom(vehInvID, gameplaysMask=255, arenaTypeID=0, randomFlags=0)
```

| Параметр        | Описание                                          |
| --------------- | ------------------------------------------------- |
| `vehInvID`      | ID танка в инвентаре (`g_currentVehicle.invID`)   |
| `gameplaysMask` | Битовая маска разрешённых режимов/карт            |
| `arenaTypeID`   | ID конкретной карты для демонстратора (0 = любая) |
| `randomFlags`   | Дополнительные флаги                              |

### gameplaysMask {#gameplay-mask}

Битовая маска включённых типов геймплея:

```python
import ArenaType
from account_helpers import gameplay_ctx

# Получить текущую маску из настроек
mask = gameplay_ctx.getMask()

# Получить маску для конкретных режимов
mask = ArenaType.getGameplaysMask(('ctf', 'domination', 'assault2'))

# Доступные режимы (constants.ARENA_GAMEPLAY_NAMES):
# 'ctf'        - Стандартный бой
# 'domination' - Встречный бой
# 'assault2'   - Штурм
# 'ctf30x30'   - Генеральное сражение (30x30)
# 'domination3' - Господство
```

### randomFlags {#random-flags}

```python
from constants import RANDOM_FLAGS

# RANDOM_FLAGS.IS_ONLY_10_MODE_ENABLED - Только бои 10 уровня
# RANDOM_FLAGS.IS_MAPS_IN_DEVELOPMENT_ENABLED - Включить тестовые карты

# Получить текущие флаги из настроек:
from account_helpers import gameplay_ctx
flags = gameplay_ctx.getRandomFlags()
```

## Названия режимов {#action-names}

```python
from gui.prb_control.settings import PREBATTLE_ACTION_NAME

PREBATTLE_ACTION_NAME.RANDOM      # 'random'
PREBATTLE_ACTION_NAME.RANKED      # 'ranked'
PREBATTLE_ACTION_NAME.COMP7       # 'comp7' (Натиск)
PREBATTLE_ACTION_NAME.EPIC        # 'epicQueue'
PREBATTLE_ACTION_NAME.SQUAD       # 'squad'
PREBATTLE_ACTION_NAME.BOOTCAMP    # 'bootcamp'
```

## Важные замечания {#important-notes}

1. **Танк должен быть выбран** — проверьте `g_currentVehicle.isPresent()` перед постановкой в очередь
2. **Используйте dispatcher для UI** — `g_prbLoader.getDispatcher().doAction()` обновляет интерфейс
3. **Прямые методы пропускают валидацию** — `player.enqueueRandom()` не проверяет танк/режим
4. **Тип очереди важен** — каждый режим имеет свой тип очереди и класс entity
