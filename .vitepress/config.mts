import { defineConfig } from 'vitepress'
import {
  GitChangelog,
  GitChangelogMarkdownSection,
} from '@nolebase/vitepress-plugin-git-changelog/vite'
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from 'vitepress-plugin-group-icons'



export default defineConfig({
  srcDir: "docs",

  rewrites: {
    'ru/:rest*': ':rest*'
  },

  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },

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
      groupIconVitePlugin({
        customIcon: {
          '.as': 'vscode-icons:file-type-actionscript',
          '.xml': 'vscode-icons:file-type-xml',
          '.bat': localIconLoader(import.meta.url, './theme/assets/devicon:windows8.svg')
        },
      })
    ],
  },

  locales: {
    root: { label: 'Русский', lang: 'ru' },
    en: { label: 'English', lang: 'en' },
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/wotstat/mods-development-docs' }
    ],

    search: { provider: 'local' },

    editLink: { pattern: 'https://github.com/wotstat/mods-development-docs/edit/main/docs/:path' },

    outline: { level: 'deep' },
  },

  ignoreDeadLinks: 'localhostLinks',

  cleanUrls: true
})
