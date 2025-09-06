import { defineConfig } from 'vitepress'
import {
  GitChangelog,
  GitChangelogMarkdownSection,
} from '@nolebase/vitepress-plugin-git-changelog/vite'


// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",

  vite: {
    plugins: [
      GitChangelog({
        repoURL: () => 'https://github.com/wotstat/mods-development-docs',
        mapAuthors: [
          {
            name: 'Andrei Soprachev',
            username: 'SoprachevAK',
            mapByEmailAliases: [
              'soprachev@mail.ru',
              '13734096+SoprachevAK@users.noreply.github.com'
            ],
          }
        ]
      }),
      GitChangelogMarkdownSection(),
    ],
  },

  locales: {
    root: {
      label: 'Русский',
      lang: 'ru',
      title: "Моды Мир Танков",
      description: "Документация к разработке модификаций для игры Мир Танков",
    },
  },

  head: [['link', { rel: 'icon', href: '/logo-small.svg' }]],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    logo: '/logo-small.svg',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wotstat/mods-development-docs' }
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Поиск',
            buttonAriaLabel: 'Поиск'
          },
          modal: {
            noResultsText: 'Ничего не найдено',
            footer: {
              selectText: 'Выбрать',
              navigateText: 'Навигация',
              closeText: 'Закрыть'
            }
          }
        }
      }
    },

    nav: [
      { text: 'Главная', link: '/' },
      { text: 'Руководство', link: '/guide/first-steps', activeMatch: '/guide/' },
      { text: 'Статьи', link: '/articles/vehicle-moe' },
    ],

    sidebar: {
      '/guide': {
        base: '/guide',
        items: [
          {
            text: 'Первые шаги',
            collapsed: false,
            base: '/guide/first-steps',
            items: [
              { text: 'Введение', link: '/' },
              { text: 'Настройка PjOrion', link: '/pjorion/' },
              { text: 'Исходный код', link: '/sources' },
              {
                text: 'Настройка окружения', items: [
                  { text: 'Для Python', link: '/python-setup' },
                  { text: 'Для AS3', link: '/as3-setup' },
                  { text: 'Для AS3 c Animate', link: '/animate-setup' },
                ]
              },
              { text: 'Первый мод', link: '/first-mod' },
              { text: 'Первый графический мод', link: '/first-ui-mod' }
            ]
          },
          {
            text: 'Прицелы',
          },
          {
            text: 'Ремоделлинг',
            collapsed: false,
            base: '/guide/modelling',
            items: [
              { text: 'Введение', link: '/' },
              { text: 'Unified Editor', link: '/' },
              { text: 'Blender', link: '/blender/' },
            ]
          },
          {
            text: 'Модпаки',
            collapsed: false,
            base: '/guide/modpacks',
            items: [
              { text: 'Введение', link: '/' },
              { text: 'Свой модпак', link: '/' },
              { text: 'МОСТ', link: '/' },
            ]
          },
          {
            text: 'Виджеты для стримов',
            collapsed: false,
            base: '/guide/widgets',
            items: [
              { text: 'Это тема вотстата', link: '/' },
            ]
          }
        ]
      },
      '/articles': {
        base: '/articles',
        items: [
          {
            text: 'Статьи',
            items: [
              { text: 'Статистические данные среднего урона', link: '/vehicle-moe' }
            ]
          }
        ]
      }
    },

    editLink: {
      pattern: 'https://github.com/wotstat/mods-development-docs/edit/main/docs/:path',
      text: 'Редактировать страницу'
    },

    docFooter: {
      prev: 'Предыдущая страница',
      next: 'Следующая страница'
    },

    lastUpdated: {
      text: 'Обновлено'
    },

    notFound: {
      title: 'СТРАНИЦА НЕ НАЙДЕНА',
      quote:
        'Но если ты не изменишь направление и продолжишь искать, ты можешь оказаться там, куда направляешься.',
      linkLabel: 'перейти на главную',
      linkText: 'Отведи меня домой'
    },

    outline: {
      label: 'Содержание страницы',
      level: 'deep'
    },

    darkModeSwitchLabel: 'Оформление',
    lightModeSwitchTitle: 'Переключить на светлую тему',
    darkModeSwitchTitle: 'Переключить на тёмную тему',
    sidebarMenuLabel: 'Меню',
    returnToTopLabel: 'Вернуться к началу',
    langMenuLabel: 'Изменить язык',
    skipToContentLabel: 'Перейти к содержимому',
  },

  cleanUrls: true
})
