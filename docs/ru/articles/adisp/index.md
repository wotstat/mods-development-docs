# Асинхронное программирование {#asynchronous-programming-with-adisp}

Игра написана на `Python 2.7` в котором отсутствует `async/await`, поэтому для асинхронного программирования используется библиотека `adisp`, которая позволяет писать асинхронный код в стиле `async/await` используя корутины (генераторы).

## adisp_process {#adisp-process}
Декоратор `@adisp_process` позволяет объявить функцию как корутину, которая может использовать `yield` для ожидания завершения других асинхронных функций.

```python
from adisp import adisp_process

@adisp_process
def myAsyncFunction():
    print('Before yield')
    result = yield someOtherAsyncFunction()
    print('Result is:', result)

myAsyncFunction()
```

## adisp_async {#adisp-async}
Декоратор `@adisp_async` позволяет объявить функцию, которая принимает в качестве последний аргумент `callback` — функцию обратного вызова, которая будет вызвана с результатом выполнения асинхронной операции.

```python
from adisp import adisp_async

@adisp_async
def myAsyncFunction(callback):
    # Выполняем какую-то асинхронную операцию
    result = 42  # Результат операции
    callback(result)

def onResult(result):
    print('Result is:', result)

myAsyncFunction(onResult)
```

А так же `@adisp_async` можно ожидать внутри `@adisp_process` корутины с помощью `yield`:

```python
from adisp import adisp_process, adisp_async

@adisp_async
def someOtherAsyncFunction(callback):
    # Выполняем какую-то асинхронную операцию
    result = 42  # Результат операции
    callback(result)

@adisp_process
def myAsyncFunction():
    print('Before yield')
    result = yield someOtherAsyncFunction()
    print('Result is:', result)
