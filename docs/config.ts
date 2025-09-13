import { defineAdditionalConfig, type DefaultTheme } from 'vitepress'


const nav: DefaultTheme.NavItem[] = [
  { text: 'Главная', link: '/' },
  { text: 'Руководство', link: '/guide/first-steps', activeMatch: '/guide/' },
  { text: 'Статьи', link: '/articles/vehicle-moe' },
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
          {
            text: 'Настройка окружения', items: [
              { text: 'Для Python', link: '/environment/python/' },
              { text: 'Для AS3', link: '/environment/as3/' },
              { text: 'Для AS3 c Animate', link: '/environment/animate/' },
            ]
          },
          { text: 'Первый мод', link: '/first-mod' },
          { text: 'Первый графический мод', link: '/first-ui-mod' }
        ]
      },
      {
        text: 'Скриптинг',
        base: '/guide/scripting',
        items: [
          { text: 'Организация репозитория', link: '/repo' },
          { text: 'Исходный код', link: '/sources' },
          { text: 'Теория AS3', link: '/as3-theory' },
        ]
      },
      {
        text: 'Прицелы',
      },
      {
        text: 'Ремоделинг',
        collapsed: false,
        base: '/guide/modelling',
        items: [
          { text: 'Введение', link: '/introducing/' },
          { text: 'Blender', link: '/blender/' },
          {
            text: 'Unified Editor', items: [
              { text: 'Знакомство', link: '/unified-editor/first-steps/' },
              { text: 'Интерфейс', link: '/unified-editor/interface/' }
            ]
          },
        ]
      },
      {
        text: 'Дистрибьюция',
        collapsed: false,
        base: '/guide/modpacks',
        items: [
          { text: 'Форум', link: '/' },
          { text: 'Модпаки', link: '/' },
          { text: 'Свой модпак', link: '/' },
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
}

export default defineAdditionalConfig({
  title: "Моды Мир Танков",
  description: "Документация к разработке модификаций для игры Мир Танков",
  head: [['link', { rel: 'icon', href: '/logo-small.svg' }]],

  themeConfig: {
    logo: '/logo-small.svg',

    nav,

    sidebar,

    search: {
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

    editLink: {
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
    },

    darkModeSwitchLabel: 'Оформление',
    lightModeSwitchTitle: 'Переключить на светлую тему',
    darkModeSwitchTitle: 'Переключить на тёмную тему',
    sidebarMenuLabel: 'Меню',
    returnToTopLabel: 'Вернуться к началу',
    langMenuLabel: 'Изменить язык',
    skipToContentLabel: 'Перейти к содержимому',

  }
})