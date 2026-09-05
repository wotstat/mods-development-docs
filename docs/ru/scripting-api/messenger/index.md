# Система сообщений {#messenger-api}

Мир Танков использует **XMPP протокол** (Jabber) для приватных сообщений между игроками.

## Ключевые компоненты {#key-components}

| Компонент                       | Путь                                            | Назначение                                             |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `MessengerEntry`                | `messenger/MessengerEntry.py`                   | Главная точка входа, глобальный экземпляр `g_instance` |
| `ChatProvider.sendMessage()`    | `messenger/proto/xmpp/messages/provider.py`     | Отправка XMPP сообщений                                |
| `ChatSessionsProvider`          | `messenger/proto/xmpp/messages/chat_session.py` | Управление чат-сессиями                                |
| `ClientDecorator.sendMessage()` | `messenger/proto/xmpp/gloox_wrapper.py`         | Низкоуровневая отправка через BigWorld.XmppClient      |
| `ArenaChatHandler.broadcast()`  | `messenger/proto/bw_chat2/chat_handlers.py`     | Боевой чат                                             |

## Отправка приватного сообщения {#send-private-message}

```python
from messenger.MessengerEntry import g_instance as g_messenger
from messenger.proto.xmpp.jid import makeContactJID

def sendPrivateMessage(playerDBID, message):
    """
    Отправить приватное сообщение игроку по его database ID.
    
    :param playerDBID: ID игрока в базе данных (из arena.vehicles)
    :param message: Текст сообщения
    """
    # Получаем XMPP протокол
    xmppProto = g_messenger.protos.getPlugin('xmpp')
    if xmppProto is None:
        print("[Mod] XMPP протокол недоступен")
        return
    
    # Создаём JID (Jabber ID) для контакта
    contactJID = makeContactJID(playerDBID)
    
    # Получаем провайдер чат-сессий
    chatProvider = xmppProto.messages.chat
    
    # Отправляем сообщение (нужен активный канал с игроком)
    chatProvider.sendMessage(contactJID, message, xmppProto.getMessageFilters())
```

## Создание чат-сессии {#start-chat-session}

Перед отправкой сообщения нужно открыть сессию:

```python
from messenger.proto.xmpp.jid import makeContactJID

def startChatWithPlayer(playerDBID, playerName):
    """Начать чат-сессию с игроком"""
    xmppProto = g_messenger.protos.getPlugin('xmpp')
    if xmppProto:
        contactJID = makeContactJID(playerDBID)
        # Это откроет окно чата с игроком
        xmppProto.messages.chat.startSession(contactJID, playerName)
```

## Отправка сообщений в боевой чат {#battle-chat}

Для сообщений в бою (команде/всем) используется `bw_chat2`:

```python
from messenger.MessengerEntry import g_instance as g_messenger

def sendBattleMessage(text):
    """Отправить сообщение в боевой чат"""
    bwProto = g_messenger.protos.getPlugin('bw_chat2')
    if bwProto:
        # broadcast отправляет в текущий канал (команда или общий)
        arenaChat = bwProto.arenaChat
        arenaChat.broadcast(text)
```

## Получение Database ID игрока {#get-player-dbid}

```python
import BigWorld

def getPlayerDBID(vehicleID):
    """Получить database ID игрока по ID техники"""
    player = BigWorld.player()
    if player and hasattr(player, 'arena'):
        vehicleInfo = player.arena.vehicles.get(vehicleID)
        if vehicleInfo:
            return vehicleInfo.get('accountDBID')
    return None
```

## Важные замечания {#important-notes}

1. **Нужна активная сессия** — вызовите `startSession()` перед отправкой приватных сообщений
2. **Проверка бана** — система автоматически проверяет, не забанен ли игрок в чате
3. **Фильтры** — сообщения проходят через цепочку фильтров (цензура, спам-защита)
4. **DBID** — для идентификации игрока используйте `databaseID`: `player.arena.vehicles[vehicleID]['accountDBID']`

## Типы сообщений {#message-types}

Из `messenger/proto/xmpp/gloox_constants.py`:

- `MESSAGE_TYPE.CHAT` — приватный чат 1-на-1
- `MESSAGE_TYPE.GROUPCHAT` — MUC (групповой чат)
- `MESSAGE_TYPE.NORMAL` — одиночное сообщение без сессии