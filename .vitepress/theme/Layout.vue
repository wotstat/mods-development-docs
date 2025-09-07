<template>
  <Layout />
</template>


<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import giscusTalk from 'vitepress-plugin-comment-with-giscus'
import { useData, useRoute } from 'vitepress';
import { toRefs } from 'vue';

const { Layout } = DefaultTheme

const { frontmatter } = toRefs(useData());
const route = useRoute();

giscusTalk({
  repo: 'wotstat/mods-development-docs',
  repoId: 'R_kgDOPqmHMA',
  category: 'Docs Comments',
  categoryId: 'DIC_kwDOPqmHMM4CvE5y',
  mapping: 'pathname',
  inputPosition: 'top',
  lang: 'ru',
  locales: {
    'en-US': 'en',
    'ru-RU': 'ru'
  },
  homePageShowComment: false,
  lightTheme: 'light',
  darkTheme: 'transparent_dark',
}, {
  frontmatter, route
},
  true
)
</script>
