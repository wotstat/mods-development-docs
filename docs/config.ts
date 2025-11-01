import { defineAdditionalConfig, type DefaultTheme } from 'vitepress'


const nav: DefaultTheme.NavItem[] = [
  { text: 'Главная', link: '/' },
  { text: 'Руководство', link: '/guide/first-steps/introduction/', activeMatch: '/guide/' },
  { text: 'Статьи', link: '/articles/vehicle-moe', activeMatch: '/articles/' },
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
          { text: 'Введение', link: '/introduction/' },
          { text: 'Настройка PjOrion', link: '/pjorion/' },
          { text: 'Настройка DevTools', link: '/devtools/' },
          {
            text: 'Настройка окружения', items: [
              { text: 'Для Python', link: '/environment/python/' },
              { text: 'Для AS3', link: '/environment/as3/' },
              { text: 'Для AS3 c Animate', link: '/environment/animate/' },
            ]
          },
          { text: 'Первый мод', link: '/first-mod/' },
          { text: 'Первый графический мод', link: '/first-ui-mod/' },
          { text: 'Автоматизация', link: '/automatization/' },
        ]
      },
      {
        text: 'Скриптинг',
        collapsed: false,
        base: '/guide/scripting',
        items: [
          { text: 'Исходный код', link: '/sources/' },
          { text: 'Теория AS3', link: '/as3-theory/' },
          { text: 'Теория Gameface', link: '/gameface-theory/' },
        ]
      },
      {
        text: 'Интеграции',
        collapsed: false,
        base: '/guide/integrations',
        items: [
          { text: 'Настройки модов', link: '/mods-settings/' },
          { text: 'Список модов', link: '/mods-list/' },
          {
            text: 'WotStat виджеты',
            base: '/guide/integrations/wotstat-widgets/',
            collapsed: true,
            items: [
              { text: 'Введение', link: '/introduction/' },
              { text: 'Взаимодействие с игрой', link: '/data-provider/' },
              { text: 'Удалённое управление', link: '/remote-control/' },
            ]
          },
        ]
      },
      {
        text: 'Прицелы',
        collapsed: false,
        base: '/guide/crosshair',
        items: [
          { text: 'Как работают', link: '/how-it-works/' },
        ]
      },
      {
        text: 'Ремоделинг',
        collapsed: false,
        base: '/guide/modelling',
        items: [
          { text: 'Введение', link: '/introduction/' },
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
        base: '/guide/distribution',
        items: [
          { text: 'Форум', link: '/forum/' },
          { text: 'Модпаки', link: '/modpacks/' },
          { text: 'Свой модпак', link: '/create-modpack/' },
        ]
      },
      {
        text: 'Виджеты',
        collapsed: false,
        base: '/guide/widgets',
        items: [
          { text: 'Для стримов', link: '/stream/' }
        ]
      },
      {
        text: 'Полезные программы',
        collapsed: false,
        base: '/guide/programs',
        items: [
          { text: 'FFDec', link: '/ffdec/' },
        ]
      },
      {
        text: 'Другое',
        collapsed: false,
        base: '/guide/other',
        items: [
          { text: 'Как редактировать документацию', link: '/edit-docs/' },
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
          { text: 'Виджет с удалённым управлением', link: '/how-to-create-remote-control-widget/' },
          { text: 'Статистические данные среднего урона', link: '/vehicle-moe/' },
          { text: 'Как создать контекстное меню', link: '/how-to-create-context-menu/' },
          { text: 'Как работать с Dependency Injections', link: '/how-to-work-with-di/' },
          { text: 'Асинхронное программирование', link: '/adisp/' },
          { text: 'Мультизапуск', link: '/multilaunch/' },
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