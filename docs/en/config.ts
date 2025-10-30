import { defineAdditionalConfig, type DefaultTheme } from 'vitepress'


const nav: DefaultTheme.NavItem[] = [
  { text: 'Home', link: '/en/' },
  { text: 'Guide', link: '/en/guide/first-steps/introducing/', activeMatch: '/en/guide/' },
  { text: 'Articles', link: '/en/articles/how-to-create-context-menu/', activeMatch: '/en/articles/' },
]

const sidebar: DefaultTheme.Sidebar = {
  '/en/guide': {
    base: '/en/guide',
    items: [
      {
        text: 'First Steps',
        collapsed: false,
        base: '/en/guide/first-steps',
        items: [
          { text: 'Introduction', link: '/introducing/' },
          { text: 'PjOrion Setup', link: '/pjorion/' },
          {
            text: 'Environment Setup', items: [
              { text: 'Python', link: '/environment/python/' },
              { text: 'AS3', link: '/environment/as3/' },
              { text: 'AS3 with Animate', link: '/environment/animate/' },
            ]
          },
          { text: 'First Mod', link: '/first-mod/' },
          { text: 'First UI Mod', link: '/first-ui-mod/' },
          { text: 'Automation', link: '/automatization/' },
        ]
      },
      {
        text: 'Scripting',
        collapsed: false,
        base: '/en/guide/scripting',
        items: [
          { text: 'Source Code', link: '/sources/' },
          { text: 'AS3 Theory', link: '/as3-theory/' },
        ]
      },
      {
        text: 'Crosshairs',
        collapsed: false,
        base: '/en/guide/crosshair',
        items: [
          { text: 'How They Work', link: '/how-it-works/' },
        ]
      },
      {
        text: 'Remodelling',
        collapsed: false,
        base: '/en/guide/modelling',
        items: [
          { text: 'Introduction', link: '/introducing/' },
          { text: 'Blender', link: '/blender/' },
          {
            text: 'Unified Editor', items: [
              { text: 'First Steps', link: '/unified-editor/first-steps/' },
              { text: 'Interface', link: '/unified-editor/interface/' }
            ]
          },
        ]
      },
      {
        text: 'Distribution',
        collapsed: false,
        base: '/en/guide/distribution',
        items: [
          { text: 'Forum', link: '/forum/' },
          { text: 'Modpacks', link: '/modpacks/' },
          { text: 'Own Modpack', link: '/create-modpack/' },
        ]
      },
      {
        text: 'Widgets',
        collapsed: false,
        base: '/en/guide/widgets',
        items: [
          { text: 'For Streams', link: '/stream/' },
        ]
      },
      {
        text: 'Other',
        collapsed: false,
        base: '/en/guide/other',
        items: [
          { text: 'Editing Documentation', link: '/edit-docs/' },
        ]
      }
    ]
  },
  '/en/articles': {
    base: '/en/articles',
    items: [
      {
        text: 'Articles',
        items: [
          { text: 'Create Context Menu', link: '/how-to-create-context-menu/' },
          { text: 'Working with Dependency Injection', link: '/how-to-work-with-di/' },
          { text: 'Asynchronous Programming', link: '/adisp/' },
          { text: 'Multi Launch', link: '/multilaunch/' },
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
      label: 'Page Contents',
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