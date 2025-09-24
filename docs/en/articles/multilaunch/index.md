---
title: Multilaunch (Multiple Game Clients)
description: Safe approaches for launching multiple World Of Tanks clients for testing mods.
---

# Multilaunch {#multilaunch}

::: danger Warning!
Running multiple clients may be treated as a forbidden modification. Use it **ONLY** for mod testing in training rooms or on test servers.
:::

When developing battle mods you have to test them somewhere. Options:
- "Topography" mode (WG only): enter a battle with bots that stay still and shoot when they have direct vision.
- "Proving Ground" mode: real battles with players versus bots. Bots are AI controlled; results don’t count toward overall account statistics and allies won’t mind if you don’t actively participate.
- Training Rooms: requires multiple accounts, hence multilaunch.

## WGC Multilaunch {#wgc-multilaunch}
Easiest method: use `wgc.multilaunch`, which resets the launcher state after a client starts.
1. Download the latest `wgc_multilaunch.exe` from the [official repository](https://gitlab.com/openwg/wgc.multilaunch/-/releases).
2. Launch the game client any way (launcher, PjOrion, etc.).
3. Wait until you enter the hangar.
4. Run `wgc_multilaunch.exe` – it resets the launcher state and immediately exits (no window).
5. Launch the client again any way.
6. Repeat steps 4–5 for as many copies as you need.

## Windows Sandbox {#windows-sandbox}

You can also use the built-in Windows Sandbox component.
1. Open Start menu and type "Turn Windows features on or off".
2. In the list check "Windows Sandbox".
3. Click OK and wait for installation (a reboot may be required).

Now you can run the game inside the sandbox:

:::tip TODO
If you know a good sandbox workflow (ideally connecting to PjOrion) please document it and send a PR. Screenshots welcome.
:::
