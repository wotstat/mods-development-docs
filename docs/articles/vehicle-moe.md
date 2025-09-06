# Получаем статистические данные среднего урона на технике внутри клиента

Ниже показано, как из клиента запросить у сервера распределение среднего урона по технике.

## Коротко об идее

Для отправки запросов на сервер используются методы `doCmd()`. В нашем случае — метод `doCmdInt()` (он принимает один целочисленный аргумент). Вообще это семейство методов:

- `doCmdStr()` — принимает строковый аргумент;
- `doCmdInt2()` — принимает два целочисленных аргумента;
- и т.д.

На клиенте аналогичные методы реализованы в классе `PlayerAccount` — сущности аккаунта игрока (также существуют `PlayerLogin`, `PlayerAvatar`). Конкретная сущность возвращается в зависимости от пространства, из которого вызывается `BigWorld.player()`. Чтобы получить сущность аккаунта игрока, вызывать `BigWorld.player()` нужно, находясь в лобби (ангаре).

## Пример кода запроса

```python :line-numbers {1}
import BigWorld
from gui.shared.personality import ServicesLocator
from skeletons.gui.app_loader import GuiGlobalSpaceID

# Имя команды для получения статистических данных
from AccountCommands import CMD_GET_VEHICLE_DAMAGE_DISTRIBUTION

# Идентификатор (числовой компакт-дескриптор) для ИС-7
intCompactDescr = 7169

def callback(requestID, responseID, errorStr, ext=None):
    print('response is {}'.format(ext))

def onGUISpaceEntered(spaceID):
    if spaceID == GuiGlobalSpaceID.LOBBY:
        playerAccount = BigWorld.player()
        playerAccount._doCmdInt(
            CMD_GET_VEHICLE_DAMAGE_DISTRIBUTION,
            intCompactDescr,
            callback
        )

ServicesLocator.appLoader.onGUISpaceEntered += onGUISpaceEntered
```

## Вспомогательные методы `PlayerAccount`

```python :line-numbers {1}
class PlayerAccount(...):
    ...
    # Вызывает self.base.doCmdStr.
    # Callback вызывается при получении ответа: callback(requestID, resultID).
    def _doCmdStr(self, cmd, s, callback):
        return self.__doCmd('doCmdStr', cmd, callback, s)

    # Вызывает self.base.doCmdIntStr.
    # Callback вызывается при получении ответа: callback(requestID, resultID).
    def _doCmdIntStr(self, cmd, int1, s, callback):
        return self.__doCmd('doCmdIntStr', cmd, callback, int1, s)

    # Вызывает self.base.doCmdInt.
    # Callback вызывается при получении ответа:
    #   callback(requestID, resultID).
    def _doCmdInt(self, cmd, int_, callback):
        return self.__doCmd('doCmdInt', cmd, callback, int_)

    # Вызывает self.base.doCmdInt2.
    # Callback вызывается при получении ответа:
    #   callback(requestID, resultID).
    def _doCmdInt2(self, cmd, int1, int2, callback):
        return self.__doCmd('doCmdInt2', cmd, callback, int1, int2)
    ...
```

Все эти методы вызывают приватный метод `__doCmd()`, в который передаются название серверного метода, код команды, необходимые аргументы и `callback` для серверного ответа.

Таким образом, помимо аргумента, соответствующего типу `doCmd()`-команды, при обращении через `PlayerAccount` метод должен принимать:
- ID команды (в нашем случае `AccountCommands.CMD_GET_VEHICLE_DAMAGE_DISTRIBUTION`);
- аргумент для команды;
- колбэк.

## Формат ответа

В случае **успешного** ответа от сервера в колбэк приходит 4 аргумента:

- `requestID` — ID запроса;  
- `resultID` — код состояния ответа;  
- `errorStr` — строка ошибки (при успешном ответе — пустая строка `''`);  
- `ext` *(extended information)* — распакованный ответ от сервера.

В случае **отрицательного** ответа передаются 3 аргумента (без `ext`).

> Ограничение: не более **1 запроса в секунду**. Если лимит превышен, сервер вернёт `resultID = -5`, а `errorStr = "COOLDOWN"`.

## Пример успешного ответа

Для ИС-7 (`intCompactDescr = 7169`) структура ответа (`ext`) имеет вид:

```python
{
    'battleCount': 1299652,
    'maxDamage': 4974,
    'distForMarkOnGun': (2429, 3472, 4304),
    'fullDamageDist': [
        ((0, 20),   (0,    613)),
        ((20, 40),  (613,  1498)),
        ((40, 55),  (1498, 2046)),
        ((55, 65),  (2046, 2429)),
        ((65, 75),  (2429, 2891)),
        ((75, 85),  (2891, 3472)),
        ((85, 95),  (3472, 4304)),
        ((95, 100), (4304, 4974))
    ],
    'damageBetterThanNPercent': (0, 613, 1498, 2046, 2429, 2891, 3472, 4304, 4974)
}
```

### Пояснения к полям

- `maxDamage` — максимальный средний урон на технике, соответствующий 100%.  
- `distForMarkOnGun` — значения среднего урона для отметок на стволе: 1-й (65%), 2-й (85%), 3-й (95%).  
- `fullDamageDist` — список кортежей; каждый соответствует интервалу среднего урона.  
  Пример: `((20, 40), (613, 1498))`, где:
  - первый вложенный кортеж — это процентили (20% и 40%),
  - второй — значения среднего урона для этих процентов (613 для 20% и 1498 для 40%).
