# API Справочник {#api-reference}

Справочник по основным API игры для разработчиков модификаций.

## Разделы {#sections}

### [Система сообщений](./messenger.md) {#messenger}

Отправка приватных сообщений игрокам и работа с боевым чатом через XMPP протокол.

- Приватные сообщения
- Боевой чат
- Чат-сессии

### [Очередь в бой](./battle-queue.md) {#battle-queue}

Постановка игрока в очередь на бой и управление режимами.

- Типы очередей (случайные, ранговые, Натиск)
- События очереди
- Параметры `enqueueRandom`

### [Инвентарь танков](./vehicle-inventory.md) {#vehicle-inventory}

Получение списка танков игрока и работа с инвентарём.

- Фильтрация танков
- Свойства объекта Vehicle
- Критерии поиска

## Быстрый старт {#quick-start}

### Получить текущий танк

```python
from CurrentVehicle import g_currentVehicle

if g_currentVehicle.isPresent():
    print("Танк: %s" % g_currentVehicle.item.userName)
```

### Встать в очередь

```python
from gui.prb_control.dispatcher import g_prbLoader

dispatcher = g_prbLoader.getDispatcher()
if dispatcher:
    dispatcher.doAction()
```

### Отправить сообщение в боевой чат

```python
from messenger.MessengerEntry import g_instance as g_messenger

bwProto = g_messenger.protos.getPlugin('bw_chat2')
if bwProto:
    bwProto.arenaChat.broadcast("Привет!")
```
