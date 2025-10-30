# Взаимодействие с игрой {#data-provider}

Для взаимодействия с игрой используется мод `data-provider`, он запускает локальный `WebSocket` сервер, к которому могут подключаться виджеты для получения данных об игре.

В целях безопасности, `data-provider` односторонний, он предаёт данные виджетам, но не позволяет виджетам отправлять команды в игру.


## Основная концепция {#concept}

Data Provider оперирует двумя сущностями для передачи данных:
- `State` – состояние, которое хранит актуальное значение и уведомляет об изменениях этого значения. *Например текущий танк игрока.*
- `Trigger` – мгновенное событие, которое не имеет постоянного значения, и просто уведомляет о том, что событие произошло (может передавать данные). *Например получение результатов боя.*


## Работа c `wotstat-widgets-sdk` {#working-with-wotstat-widgets-sdk}

Все виджеты это обычные веб-страницы, что бы добавить поддержку Data Provider, необходимо подключить [`wotstat-widgets-sdk`](https://www.npmjs.com/package/wotstat-widgets-sdk) и подписаться на необходимые состояния и триггеры.

### Установка {#installation}
:::code-group

```sh [npm]
$ npm add -D wotstat-widgets-sdk
```


```sh [bun]
$ bun add -D wotstat-widgets-sdk
```

```html [index.html]
<script src="https://unpkg.com/wotstat-widgets-sdk"></script>
```
:::

### WidgetSDK {#working-with-widgetsdk}

Для начала вам необходимо инициализировать SDK, так же вы можете подписаться на изменение статуса подключения к игре.

```js
import { WidgetSDK } from 'wotstat-widgets-sdk'

// инициализация SDK
const sdk = new WidgetSDK()

// подписка на изменение статуса (ожидание открытия игры)
sdk.onStatusChange(status => console.log(status))
```

У объекта `sdk` есть поле `data`, которое содержит все доступные состояния и триггеры. 

Состояния определяются классом `State`, у которого есть поле `value` с текущим значением и метод `watch`, который позволяет подписаться на изменение значения. У триггеров есть только метод `watch`, который позволяет подписаться на событие.

У объекта `sdk` есть полная `TypeScript` типизация, благодаря которой у вас будут подсказки по доступным состояниям и триггерам. Изучить доступные состояния и триггеры вы можете в [исходном коде библиотеки](https://github.com/wotstat/wotstat-widgets-sdk/blob/main/lib/sdk/dataTypes/index.ts).


```js
// получение текущего танка
const currentTank = sdk.data.hangar.vehicle.info.value
console.log('Current tank:', currentTank)

// подписка на изменение танка
sdk.data.hangar.vehicle.info.watch((newValue, oldValue) => {
  console.log('New tank:', newValue)
  console.log('Old tank:', oldValue)
})

// подписка на получение результата боя
sdk.data.battle.onBattleResult.watch(result => {
  console.log('Battle result:', result)
})
```

Виджет может получать информацию от кнопок управления в игре (если виджет добавлен в игру через мод `Wotstat Widgets`).
Например, вы можете подписаться на событие очистки данных виджета через `sdk.commands.onClearData`:

```js
// подписка на действие очистки данных
const { setReadyToClearData } = sdk.commands.onClearData(() => console.log('Clear data'))

// готовность к очистке данных (если передать false, то кнопки очистки данных не будет)
setReadyToClearData(true)
```

### WidgetMetaTags {#widget-meta-tags}
Для определения того, как мод `Wotstat Widgets` должен обрабатывать ваш виджет, вы можете использовать специальные мета-теги в `HTML` вашего виджета с префиксом `wotstat-widget:`. 

Пример `meta` тега в `HTML`:

```html
<head>
  <meta name="wotstat-widget:auto-height" content="true">
  <meta name="wotstat-widget:preferred-top-layer" content="true">
</head>
```

Поддерживаемые теги:
| Мета-тег              | Описание                                                                             |
| --------------------- | ------------------------------------------------------------------------------------ |
| `auto-height`         | Автоматическое изменение высоты виджета по размеру `body`                            |
| `hangar-only`         | Виджет доступен только в ангаре                                                      |
| `ready-to-clear-data` | Готовность к очистке данных (если передать false, то кнопки очистки данных не будет) |
| `use-sniper-mode`     | Позиция виджета должна отключаться в аркадном и снайперском прицелах                 |
| `preferred-top-layer` | Виджет должен быть в верхнем слое (ручная настройка по ПКМ более приоритета)         |
| `unlimited-size`      | Убрать ограничение на размер виджета                                                 |
| `insets`              | Установить отрицательный отступ, чтоб виджет мог выходить за границы рамки           |

Для удобной работы с мета-тегами, вы можете использовать класс `WidgetMetaTags` из `wotstat-widgets-sdk`.

```js
import { WidgetMetaTags } from 'wotstat-widgets-sdk'

// включить автоматическое изменение высоты виджета, если оно было отключено
WidgetMetaTags.setAutoHeight(true)

// сделать виджет доступным только в ангаре
WidgetMetaTags.setHangarOnly(true)

// разрешить очистку данных (пкм -> очистить данные)
WidgetMetaTags.setReadyToClearData(true)

// указать, что позиция виджета должна различаться в аркадном и снайперском прицелах (ручная настройка по ПКМ более приоритета)
WidgetMetaTags.setUseSniperMode(true)

// указать, что виджет должен быть в верхнем слое (ручная настройка по ПКМ более приоритета)
WidgetMetaTags.setPreferredTopLayer(true)

// убрать ограничение на размер виджета
WidgetMetaTags.setUnlimitedSize(true)

// установить отрицательный отступ, чтоб виджет мог выходить за границы рамки
WidgetMetaTags.setInsets({ top: 10, right: 10, bottom: 10, left: 10 })
```

### WidgetRelay {#widget-relay}
Используется для создания pear-to-pear взаимодействия между виджетами. Позволяет определить состояние, которое будет синхронизироваться между всеми виджетами, использующими этот `WidgetsRelay`. Состояния не хранятся на сервере, а передаются напрямую между виджетами.


```js
import { WidgetsRelay } from 'wotstat-widgets-sdk'

const relay = new WidgetsRelay()

const simple = relay.createState('simple', 0)
const complex = relay.createState('complex', { foo: { bar: 0, 'long/deep': 0 }, baz: 0 })
```

Для установки значения состояния используется обычная запись в свойство `value`, при изменении комплексных значений, необходимо вызвать метод `trigger()`, чтоб сообщить системе, что значение изменилось.

```js
// Слежение за изменением, вызывается и при изменении своего значения и при синхронизации
simple.watch(v => {
  console.log('Simple value changed:', v)
  console.log('Current value:', simple.value)
  console.log('All users values:', simple.all)
}, { immediate: true })


// Изменение простого состояния
simple.value = 5

// Изменение комплексного состояния
counter.value.baz = 10
counter.trigger()
```

Синхронизация производится внутри канала по ключу состояния, ключ канала задаётся в URL, например: `?channel-key=demo` или в параметрах `new WidgetsRelay({ channel: 'demo' })`.


### Стили {#styles}

SDK предоставляет некоторые стандартные стили для удобства разработки виджетов. Доступ к стилям можно получить двумя способами:
- Через использование длинных классов (например, `wotstat-background`, `wotstat-accent`)
- Через использование родительского класса `widgets-sdk-styles` и дочерних коротких классов (например, `background`, `accent`)

Стили будут доступны после инициализации SDK или вы можете проинициализировать их самостоятельно:

```js
import { injectStylesheet, setupStyles } from 'wotstat-widgets-sdk'

// Вставляет код CSS в head документа
injectStylesheet()

// Вставляет код CSS в head документа и добавляет обработчики на обновление стилей от query параметров. Вызов injectStylesheet не требуется.
setupStyles()
```

> Цвета `background` и `accent` автоматически изменяются в зависимости от query параметров в URL.
>  `background` и `accent` соответственно, например: `?background=292929&accent=4ee100`. Поддерживается прозрачность.


```html
<body>
  <div class="widgets-sdk-styles">
    <div class="background">
      <h1 class="accent">Widget</h1>
    </div>
  </div>

  <div class="wotstat-background">
    <h1 class="wotstat-accent">Widget</h1>
  </div>
</body>
```

Более подробная информация в [документации о стилях](https://github.com/wotstat/wotstat-widgets-sdk/blob/HEAD/docs/styles.md).

## Моды-расширения {#extensions}

Если вам недостаточно предоставляемых данных, вы можете написать мод-расширение для `data-provider`, которое будет передавать дополнительные данные в виджеты.

### Проверка наличия `dataProvider` {#checking-data-provider}
```python
def checkDataProvider():
  if not hasattr(BigWorld, 'wotstat_dataProvider'):
    return False
  return BigWorld.wotstat_dataProvider.version
```

### Регистрация расширения {#registering-extension}
```python
demo_extension = BigWorld.wotstat_dataProvider.registerExtension('exampleExtension')
```

### Состояние `State` {#registering-state}
```python
# регистрация состояния
state = demo_extension.createState(['demo', 'state'], 'Hello World!')

# получить текущее значение
value = state.getValue()

# установить новое значение
state.setValue('Hello World, Again!')
```

### Триггер `Trigger` {#registering-trigger}
```python
# регистрация триггера
state = demo_extension.createTrigger(['demo', 'trigger'])

# вызов триггера c данными
trigger.trigger('Hello World from Trigger!')
```


### Использование расширений {#using-extensions}

Доступ к данным расширений осуществляется по пути `data.extensions`, список зарегистрированных расширений можно получить по пути `data.registeredExtensions`.

Вы можете подписаться на изменения данных расширения даже если оно не зарегистрировано в SDK. В этом случае значение по любому пути будет `undefined` до тех пор, пока расширение не будет зарегистрировано.

Рекомендуется типизировать используемые расширения с помощью `d.ts` файлов.

> Объявление типов расширений необходимо исключительно для удобства разработки и не влияет на работу SDK.

```ts [ExampleExtension.d.ts]
import { State, Trigger, WidgetSDK } from "wotstat-widgets-sdk"

declare global {
  interface WidgetsSdkExtensions {
    exampleExtension: {
      demo: {
        state: State<string>
        trigger: Trigger<string>
      }
    }
  }
}
```

Использование расширения в коде виджета:
```ts
const sdk = new WidgetSDK()
sdk.data.extensions.exampleExtension.demo.state.onChange(<...>)
sdk.data.extensions.exampleExtension.demo.trigger.onTrigger(<...>)
```
