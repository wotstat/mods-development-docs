import { defineAdditionalConfig, type DefaultTheme } from 'vitepress'


const nav: DefaultTheme.NavItem[] = [
  { text: 'Main', link: '/en' },
  { text: 'Guide', link: '/en/guide/first-steps', activeMatch: '/en/guide/' },
  { text: 'Articles', link: '/en/articles/vehicle-moe' },
]

const sidebar: DefaultTheme.Sidebar = {
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
        text: 'Articles',
        items: [
          { text: 'Статистические данные среднего урона', link: '/vehicle-moe' }
        ]
      }
    ]
  }
}

export default defineAdditionalConfig({
  title: "WoT Mods",
  description: "Documentation for modding World Of Tanks",
  head: [['link', { rel: 'icon', href: '/wot-logo-small.svg' }]],


  themeConfig: {
    logo: '/wot-logo-small.svg',

    nav,

    sidebar,

    search: {
      options: {
        translations: {
          button: {
            buttonText: 'Search',
            buttonAriaLabel: 'Search'
          },
          modal: {
            noResultsText: 'No results found',
            footer: {
              selectText: 'Select',
              navigateText: 'Navigate',
              closeText: 'Close'
            }
          }
        }
      }
    },

    editLink: {
      text: 'Edit this page'
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },

    lastUpdated: {
      text: 'Last updated'
    },

    notFound: {
      title: 'PAGE NOT FOUND',
      quote:
        'But if you don’t change your direction and keep looking, you might end up where you’re headed.',
      linkLabel: 'go to main',
      linkText: 'Take me home'
    },

    outline: {
      label: 'Page Contentss',
    },

    darkModeSwitchLabel: 'Theme',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Return to top',
    langMenuLabel: 'Change language',
    skipToContentLabel: 'Skip to content',

  }
})