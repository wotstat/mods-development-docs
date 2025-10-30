
# Retrieving Average Damage Statistics for Vehicles from the Client {#vehicle-moe}

Below is an example of how to request from the server the distribution of average damage for a vehicle from the game client.

::: tip Lesta Only
This article is relevant only for Lesta-developed versions of World of Tanks (e.g., RU, CIS, EU servers).
:::

## Concept Overview {#idea}

To send requests to the server, the `doCmd()` family of methods is used.  
In our case — the method `doCmdInt()` (it takes one integer argument).  
The family of methods includes:

- `doCmdStr()` — takes a string argument;
- `doCmdInt2()` — takes two integer arguments;
- and so on.

On the client side, these methods are implemented in the `PlayerAccount` class — the entity representing the player’s account (there are also `PlayerLogin`, `PlayerAvatar`).  
The specific entity returned depends on the context from which `BigWorld.player()` is called.  
To get the player’s account entity, `BigWorld.player()` must be called while in the lobby (garage).

## Example Request Code {#example}

```python :line-numbers {1}
import BigWorld
from gui.shared.personality import ServicesLocator
from skeletons.gui.app_loader import GuiGlobalSpaceID

# Command name for retrieving vehicle damage statistics
from AccountCommands import CMD_GET_VEHICLE_DAMAGE_DISTRIBUTION

# Identifier (integer compact descriptor) for IS-7
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

## Helper Methods in `PlayerAccount` {#playeraccount-methods}

```python :line-numbers {1}
class PlayerAccount(...):
    ...

    # Calls self.base.doCmdStr.
    # Callback is called upon response: callback(requestID, resultID).
    def _doCmdStr(self, cmd, s, callback):
        return self.__doCmd('doCmdStr', cmd, callback, s)

    # Calls self.base.doCmdIntStr.
    # Callback is called upon response: callback(requestID, resultID).
    def _doCmdIntStr(self, cmd, int1, s, callback):
        return self.__doCmd('doCmdIntStr', cmd, callback, int1, s)

    # Calls self.base.doCmdInt.
    # Callback is called upon response: callback(requestID, resultID).
    def _doCmdInt(self, cmd, int_, callback):
        return self.__doCmd('doCmdInt', cmd, callback, int_)

    # Calls self.base.doCmdInt2.
    # Callback is called upon response: callback(requestID, resultID).
    def _doCmdInt2(self, cmd, int1, int2, callback):
        return self.__doCmd('doCmdInt2', cmd, callback, int1, int2)
    ...
```

All of these methods call the private method `__doCmd()`, which receives the name of the server method, the command code, the necessary arguments, and a `callback` for the server response.

Thus, in addition to the argument matching the `doCmd()` command type, when invoked through `PlayerAccount`, the method must take:
- the command ID (in our case `AccountCommands.CMD_GET_VEHICLE_DAMAGE_DISTRIBUTION`);
- the command argument;
- the callback function.

## Response Format {#response-format}

In the case of a **successful** response from the server, the callback receives four arguments:

- `requestID` — the request ID;
- `resultID` — the response status code;
- `errorStr` — error message (empty string `''` on success);
- `ext` *(extended information)* — unpacked response from the server.

In the case of a **failed** response, only 3 arguments are passed (without `ext`).

> Limitation: no more than **1 request per second**.  
> If the limit is exceeded, the server will return `resultID = -5` and `errorStr = "COOLDOWN"`.

## Example of a Successful Response {#successful-response}

For IS-7 (`intCompactDescr = 7169`), the structure of the response (`ext`) looks like this:

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

### Field Descriptions {#fields}

- `maxDamage` — the maximum average damage for the vehicle, corresponding to 100%.
- `distForMarkOnGun` — average damage values required for gun marks: 1st (65%), 2nd (85%), 3rd (95%).
- `fullDamageDist` — a list of tuples; each corresponds to an average damage range.  
Example: `((20, 40), (613, 1498))`, where:
  - the first nested tuple represents percentiles (20% and 40%),
  - the second represents average damage values for those percentiles (613 for 20% and 1498 for 40%).
