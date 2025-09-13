
import DefaultTheme from 'vitepress/theme'
import type { Theme as ThemeConfig } from 'vitepress'
import { NolebaseGitChangelogPlugin } from '@nolebase/vitepress-plugin-git-changelog/client'
import Layout from './Layout.vue';

import './custom.css'
import '@nolebase/vitepress-plugin-git-changelog/client/style.css'
import 'virtual:group-icons.css'

export const Theme: ThemeConfig = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(NolebaseGitChangelogPlugin, {
      displayAuthorsInsideCommitLine: true,
    })
  },
  Layout: Layout,
}

export default Theme