# Документация по разработке модов для игры Мир Танков

Ссылка на документацию: [docs.wotstat.info](https://docs.wotstat.info)

Используется [VitePress](https://vitepress.dev)

Для локального запуска нужен [Bun 1.4+](https://bun.com/docs/installation).

**Установка зависимостей**

```bash
bun install
```

**Запуск**

```bash
bun run dev
```

**Сборка**

```bash
bun run build
```

Production-сборка дополнительно генерирует статический слой документации для AI-агентов:

- [`/llms.txt`](https://docs.wotstat.info/llms.txt) — индекс русской документации;
- [`/llms-full.txt`](https://docs.wotstat.info/llms-full.txt) — вся документация одним файлом;
- у каждой страницы есть Markdown-представление: для маршрутов-каталогов это соседний `index.md`;
- английские индексы доступны по тем же именам внутри `/en/`.

HTML-страницы объявляют Markdown через `rel="alternate"`, поэтому агент может начать с обычной ссылки на документацию и автоматически перейти к чистому тексту. Генерация полностью статическая и не требует Cloudflare Worker.

Проверить TypeScript отдельно:

```bash
bun run typecheck
```
