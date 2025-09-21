# Асинхронное программирование {#asynchronous-programming-with-adisp}

Игра написана на `Python 2.7` в котором отсутствует `async/await`, поэтому для асинхронного программирования используется библиотека `adisp`, которая позволяет писать асинхронный код в стиле `async/await` используя корутины (генераторы).

## `adisp_process` {#adisp-process}
Декоратор `@adisp_process` позволяет объявить процедуру как корутину, которая может использовать `yield` для ожидания завершения других асинхронных функций. Такая процедура **не может возвращать никакие значения**

```python
from adisp import adisp_process

@adisp_process
def myAsyncFunction():
    print('Before yield')
    result = yield someAsyncFunction()
    print('Result is:', result)

myAsyncFunction()
```

## `adisp_async` {#adisp-async}
Декоратор `@adisp_async` позволяет объявить функцию, которую можно ожидать в `@adisp_process` и которая **может вернуть результат** асинхронной операции по средствам вызова `callback`.

```python
from adisp import adisp_process, adisp_async

@adisp_async
def someAsyncFunction(callback):
    BigWorld.callback(1, lambda: callback(42))  # Симуляция асинхронной операции с задержкой

@adisp_process
def myAsyncFunction():
    print('Before yield')
    result = yield someAsyncFunction()
    print('Result is:', result)

myAsyncFunction()
```

## Совмещение
Декораторы `@adisp_process` и `@adisp_async` можно совмещать для создания сложных асинхронных цепочек.

```python
from adisp import adisp_process, adisp_async

@adisp_async
def someAsyncFunction(callback):
    BigWorld.callback(1, lambda: callback(42))  # Симуляция асинхронной операции с задержкой

@adisp_async
@adisp_process
def anotherAsyncFunction(callback):
    print('Before yield in anotherAsyncFunction')
    result = yield someAsyncFunction()
    print('Result in anotherAsyncFunction is:', result)
    callback(result * 2)

@adisp_process
def myAsyncFunction():
    print('Before yield in myAsyncFunction')
    result = yield anotherAsyncFunction()
    print('Result in myAsyncFunction is:', result)

myAsyncFunction()
```
