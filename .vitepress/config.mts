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

  sitemap: {
    hostname: 'https://docs.wotstat.info'
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
          },
          {
            name: 'Kurzdor',
            username: 'Kurzdor',
            mapByEmailAliases: ['kurzdor@mail.ru'],
          }
        ]
      }),
      GitChangelogMarkdownSection(),
      groupIconVitePlugin({
        customIcon: {
          '.as': 'vscode-icons:file-type-actionscript',
          '.xml': 'vscode-icons:file-type-xml',
          '.bat': localIconLoader(import.meta.url, './theme/assets/devicon:windows8.svg'),
          'pjorion': localIconLoader(import.meta.url, './theme/assets/icon:pjorion.svg')
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

  cleanUrls: true,

  head: [
    [
      'script', { type: "text/javascript" }, `
        (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=104287252', 'ym');

        ym(104287252, 'init', {ssr:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
      `
    ],
  ]
})
