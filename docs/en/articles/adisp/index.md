---
title: Asynchronous Programming with adisp
description: Using adisp to emulate async/await style coroutines in Python 2.7 World Of Tanks client.
---

# Asynchronous Programming with adisp {#asynchronous-programming-with-adisp}

The game client runs on `Python 2.7` where native `async/await` does not exist. For asynchronous style code it uses the `adisp` library, which lets you write coroutine style logic (similar to async/await) using generators.

## `adisp_process` {#adisp-process}
The `@adisp_process` decorator declares a procedure as a coroutine that can use `yield` to wait for other asynchronous functions. Such a procedure **cannot return a value**.

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
The `@adisp_async` decorator declares a function that can be awaited (yielded from) inside an `@adisp_process`, and **can return a result** of an asynchronous operation via a `callback`.

```python
from adisp import adisp_process, adisp_async

@adisp_async
def someAsyncFunction(callback):
    BigWorld.callback(1, lambda: callback(42))  # Simulate async operation with delay

@adisp_process
def myAsyncFunction():
    print('Before yield')
    result = yield someAsyncFunction()
    print('Result is:', result)

myAsyncFunction()
```

## Combining
You can combine `@adisp_process` and `@adisp_async` to build complex asynchronous chains.

```python
from adisp import adisp_process, adisp_async

@adisp_async
def someAsyncFunction(callback):
    BigWorld.callback(1, lambda: callback(42))  # Simulate async operation with delay

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
