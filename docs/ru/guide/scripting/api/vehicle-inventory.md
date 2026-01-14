# Инвентарь танков {#vehicle-inventory-api}

WoT использует **ItemsCache** для доступа к инвентарю игрока, включая танки.

## Ключевые компоненты {#key-components}

| Компонент | Путь | Назначение |
|-----------|------|------------|
| `ItemsCache` | `gui/shared/items_cache.py` | Главный кэш всех предметов |
| `ItemsRequester` | `gui/shared/utils/requesters/ItemsRequester.py` | Запрос и фильтрация предметов |
| `REQ_CRITERIA` | `gui/shared/utils/requesters/ItemsRequester.py` | Критерии фильтрации |

## Получение всех танков {#get-all-vehicles}

```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from gui.shared.utils.requesters.ItemsRequester import REQ_CRITERIA

# Получаем ItemsCache через dependency injection
itemsCache = dependency.instance(IItemsCache)

# Получить ВСЕ танки в инвентаре
allVehicles = itemsCache.items.getVehicles(REQ_CRITERIA.INVENTORY)

# Перебор танков
for intCD, vehicle in allVehicles.iteritems():
    print("Танк: %s, Уровень: %d, invID: %s" % (
        vehicle.userName, vehicle.level, vehicle.invID
    ))
```

## Фильтрация танков {#filtering-vehicles}

```python
from gui.shared.utils.requesters.ItemsRequester import REQ_CRITERIA

# Только танки в инвентаре
REQ_CRITERIA.INVENTORY

# Премиум танки
REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.PREMIUM

# Конкретный уровень (например, 10)
REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.LEVEL(10)

# Диапазон уровней (8-10)
REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.LEVELS(range(8, 11))

# Готовые к бою (есть экипаж, снаряды)
REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.READY

# По классу техники
REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.CLASSES(['heavyTank'])
# Классы: 'heavyTank', 'mediumTank', 'lightTank', 'AT-SPG', 'SPG'

# Элитные танки
REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.ELITE

# Избранные танки
REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.FAVORITE

# Комбинация критериев
criteria = (REQ_CRITERIA.INVENTORY | 
            REQ_CRITERIA.VEHICLE.LEVELS(range(8, 11)) |
            REQ_CRITERIA.VEHICLE.READY)
vehicles = itemsCache.items.getVehicles(criteria)
```

## Свойства объекта Vehicle {#vehicle-properties}

```python
# vehicle - объект из getVehicles()
vehicle.invID           # ID в инвентаре (для очереди в бой)
vehicle.intCD           # Compact Descriptor (уникальный ID типа)
vehicle.userName        # Локализованное имя ("ИС-7")
vehicle.shortUserName   # Короткое имя
vehicle.name            # Системное имя ("ussr:R45_IS-7")
vehicle.level           # Уровень (1-10)
vehicle.type            # Класс ('heavyTank', 'mediumTank', etc.)
vehicle.nation          # ID нации (0=СССР, 1=Германия, etc.)
vehicle.nationName      # Название нации строкой
vehicle.isPremium       # Премиум?
vehicle.isElite         # Элитный?
vehicle.isReadyToFight  # Готов к бою?
vehicle.isInBattle      # Сейчас в бою?
vehicle.isFavorite      # В избранном?
vehicle.isRented        # Арендованный?
vehicle.health          # Текущее HP
vehicle.repairCost      # Стоимость ремонта
vehicle.descriptor      # VehicleDescriptor с полными данными
vehicle.crew# Данные экипажа
vehicle.shells          # Заряженные снаряды
vehicle.eqs             # Оборудование
```

## Получение текущего танка {#current-vehicle}

```python
from CurrentVehicle import g_currentVehicle

# Проверить, выбран ли танк
if g_currentVehicle.isPresent():
    invID = g_currentVehicle.invID      # Inventory ID
    item = g_currentVehicle.item        # Объект Vehicle
    intCD = g_currentVehicle.intCD      # Compact descriptor
    
    print("Текущий: %s (invID=%s)" % (item.userName, invID))
```

## Получение танка по ID {#get-vehicle-by-id}

```python
# По inventory ID
vehicle = itemsCache.items.getVehicle(invID)

# По compact descriptor
vehicle = itemsCache.items.getItemByCD(intCD)
```

## Полный пример {#full-example}

```python
from helpers import dependency
from skeletons.gui.shared import IItemsCache
from gui.shared.utils.requesters.ItemsRequester import REQ_CRITERIA

class VehicleListHelper(object):
    itemsCache = dependency.descriptor(IItemsCache)
    
    def getAllVehicles(self):
        """Получить все танки в ангаре"""
        return self.itemsCache.items.getVehicles(REQ_CRITERIA.INVENTORY)
    
    def getReadyVehicles(self):
        """Получить танки готовые к бою"""
        criteria = REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.READY
        return self.itemsCache.items.getVehicles(criteria)
    
    def getVehiclesByLevel(self, level):
        """Получить танки определённого уровня"""
        criteria = REQ_CRITERIA.INVENTORY | REQ_CRITERIA.VEHICLE.LEVEL(level)
        return self.itemsCache.items.getVehicles(criteria)
    
    def getVehicleByInvID(self, invID):
        """Получить танк по inventory ID"""
        return self.itemsCache.items.getVehicle(invID)
    
    def printVehicleList(self):
        vehicles = self.getAllVehicles()
        for intCD, veh in vehicles.iteritems():
            status = "ГОТОВ" if veh.isReadyToFight else "НЕ ГОТОВ"
            print("[%d] %s (Ур.%d) invID=%s [%s]" % (
                intCD, veh.userName, veh.level, veh.invID, status
            ))

g_vehicleHelper = VehicleListHelper()
```

## Дополнительные критерии {#additional-criteria}

```python
# Специальные танки
REQ_CRITERIA.VEHICLE.SPECIAL

# Арендованные
REQ_CRITERIA.VEHICLE.RENT

# Можно продать
REQ_CRITERIA.VEHICLE.CAN_SELL

# Можно обменять (trade-in)
REQ_CRITERIA.VEHICLE.CAN_TRADE_IN

# Сейчас в бою
REQ_CRITERIA.VEHICLE.IS_IN_BATTLE

# Во взводе
REQ_CRITERIA.VEHICLE.IS_IN_UNIT

# Заблокирован экипаж
REQ_CRITERIA.VEHICLE.IS_CREW_LOCKED

# По тегам
REQ_CRITERIA.VEHICLE.HAS_TAGS({'premium', 'special'})
```
