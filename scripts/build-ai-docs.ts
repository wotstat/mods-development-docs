import path from 'node:path'

import englishDocsConfig from '../docs/en/config'
import russianDocsConfig from '../docs/config'

const SITE_ORIGIN = 'https://docs.wotstat.info'
const REPOSITORY_URL = 'https://github.com/wotstat/mods-development-docs'
const PROJECT_ROOT = path.resolve(import.meta.dir, '..')
const DOCS_ROOT = path.join(PROJECT_ROOT, 'docs')
const OUTPUT_ROOT = path.join(PROJECT_ROOT, '.vitepress', 'dist')

type Locale = 'ru' | 'en'

interface PageDraft {
  locale: Locale
  sourcePath: string
  sourceRelativePath: string
  publishedRelativePath: string
  humanPath: string
  markdownPath: string
  canonicalUrl: string
  markdownUrl: string
  sourceUrl: string
  title: string
  description: string
  content: string
}

interface FrontmatterResult {
  attributes: Record<string, string>
  body: string
}

interface NavigationItem {
  text?: string
  link?: string
  base?: string
  items?: NavigationItem[]
}

interface DocumentationSection {
  key: string
  label: string
}

const DOCS_CONFIGS = {
  ru: russianDocsConfig,
  en: englishDocsConfig,
} as const

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  '.as': 'actionscript-3',
  '.bat': 'bat',
  '.css': 'css',
  '.html': 'html',
  '.js': 'javascript',
  '.json': 'json',
  '.log': 'text',
  '.md': 'markdown',
  '.py': 'python',
  '.sh': 'bash',
  '.ts': 'typescript',
  '.xml': 'xml',
}

export function toPublishedRelativePath(locale: Locale, sourceRelativePath: string): string {
  const normalized = sourceRelativePath.replaceAll('\\', '/')
  return locale === 'en' ? `en/${normalized}` : normalized
}

export function toHumanPath(publishedRelativePath: string): string {
  if (publishedRelativePath === 'index.md') return '/'
  if (publishedRelativePath.endsWith('/index.md')) {
    return `/${publishedRelativePath.slice(0, -'index.md'.length)}`
  }
  return `/${publishedRelativePath.slice(0, -'.md'.length)}`
}

function splitFrontmatter(source: string): FrontmatterResult {
  const normalized = source.replaceAll('\r\n', '\n')
  if (!normalized.startsWith('---\n')) return { attributes: {}, body: normalized }

  const end = normalized.indexOf('\n---\n', 4)
  if (end === -1) return { attributes: {}, body: normalized }

  const attributes: Record<string, string> = {}
  const rawFrontmatter = normalized.slice(4, end)
  for (const line of rawFrontmatter.split('\n')) {
    const match = line.match(/^([\w-]+):\s*(.+?)\s*$/)
    if (!match) continue
    attributes[match[1]] = match[2].replace(/^(?:"|')|(?:"|')$/g, '')
  }

  return { attributes, body: normalized.slice(end + 5) }
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\s*\{#[^}]+\}\s*$/u, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\{(?:target|width|height|download|external)[^}]*\}/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTitle(content: string, locale: Locale, sourceRelativePath: string): string {
  if (sourceRelativePath === 'index.md') {
    return locale === 'ru'
      ? 'Разработка модов для игры «Мир танков»'
      : 'Mod development for World of Tanks'
  }

  const heading = content.match(/^#\s+(.+)$/m)?.[1]
  if (heading) return stripInlineMarkdown(heading)

  return sourceRelativePath
    .replace(/\/index\.md$/, '')
    .replace(/\.md$/, '')
    .split('/')
    .pop()!
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function extractDescription(
  content: string,
  title: string,
  explicitDescription?: string,
): string {
  if (explicitDescription) return stripInlineMarkdown(explicitDescription)

  const paragraphs = content.split(/\n\s*\n/)
  for (const paragraph of paragraphs) {
    const candidate = paragraph.replace(/\n/g, ' ').trim()
    if (!candidate) continue
    if (/^(?:#|>|```|~~~|\*\*[^*]+\*\*$|[-*]\s|<)/.test(candidate)) continue
    if (/help translate|if you know russian|original language|русская версия/i.test(candidate)) continue

    const plain = stripInlineMarkdown(candidate)
    if (plain.length < 20) continue
    return plain.length > 240 ? `${plain.slice(0, 237).trimEnd()}...` : plain
  }

  return `Documentation page: ${title}.`
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const files = await Array.fromAsync(new Bun.Glob('**/*.md').scan({
    cwd: directory,
    onlyFiles: true,
  }))
  return files.map((file) => file.replaceAll('\\', '/')).sort()
}

async function expandIncludes(
  content: string,
  sourcePath: string,
  includeStack = new Set<string>(),
): Promise<string> {
  const absoluteSourcePath = path.resolve(sourcePath)
  if (includeStack.has(absoluteSourcePath)) {
    throw new Error(`Circular Markdown include detected at ${absoluteSourcePath}`)
  }

  const nextStack = new Set(includeStack).add(absoluteSourcePath)
  const output: string[] = []

  for (const line of content.split('\n')) {
    const markdownInclude = line.match(/^\s*<!--\s*@include:\s*(.+?)\s*-->\s*$/)
    if (markdownInclude) {
      const includePath = path.resolve(path.dirname(sourcePath), markdownInclude[1])
      const included = splitFrontmatter(await Bun.file(includePath).text()).body
      output.push(await expandIncludes(included, includePath, nextStack))
      continue
    }

    const codeInclude = line.match(/^\s*<<<\s+(\S+)(?:\s+\[([^\]]+)\])?\s*$/)
    if (codeInclude) {
      const rawPath = codeInclude[1].replace(/(?:#[^{}]+|\{[^}]+\})$/, '')
      const includePath = path.resolve(path.dirname(sourcePath), rawPath)
      const included = (await Bun.file(includePath).text()).replaceAll('\r\n', '\n').trimEnd()
      const label = codeInclude[2] ?? path.basename(includePath)
      const language = LANGUAGE_BY_EXTENSION[path.extname(includePath).toLowerCase()] ?? 'text'
      output.push(`**${label}**\n\n\`\`\`\`${language}\n${included}\n\`\`\`\``)
      continue
    }

    output.push(line)
  }

  return output.join('\n')
}

export function normalizeVitePressMarkdown(source: string): string {
  const withoutStyles = source
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(
      /<video\b[^>]*>[\s\S]*?<source\b[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/gi,
      'Video: [open media]($1)',
    )
    .replace(/<span\s+v-pre>([\s\S]*?)<\/span>/gi, '$1')
    .replace(/<\/?u>/gi, '')

  const output: string[] = []
  let fence: { character: string; length: number } | undefined

  for (const originalLine of withoutStyles.split('\n')) {
    const trimmed = originalLine.trim()

    if (fence) {
      output.push(originalLine)
      const closing = trimmed.match(/^(`{3,}|~{3,})\s*$/)
      if (closing && closing[1][0] === fence.character && closing[1].length >= fence.length) {
        fence = undefined
      }
      continue
    }

    const openingFence = originalLine.match(/^(\s*)(`{3,}|~{3,})([^\s]*)?(?:\s+\[([^\]]+)\])?.*$/)
    if (openingFence) {
      const [, indentation, marker, rawLanguage = '', label] = openingFence
      const language = rawLanguage.replace(/\{[^}]*\}$/, '')
      if (label) output.push(`${indentation}**${label}**`, '')
      output.push(`${indentation}${marker}${language}`)
      fence = { character: marker[0], length: marker.length }
      continue
    }

    const container = originalLine.match(/^\s*:{3,}\s*([\w-]+)?\s*(.*?)\s*$/)
    if (container) {
      const type = container[1]
      const title = container[2]
      if (!type) {
        output.push('')
      } else if (type === 'code-group') {
        output.push('')
      } else if (type === 'details') {
        output.push(`**Details${title ? ` — ${title}` : ''}**`, '')
      } else {
        output.push(`> **${type.toUpperCase()}${title ? ` — ${title}` : ''}**`, '')
      }
      continue
    }

    if (/^#{1,6}\s/.test(originalLine)) {
      output.push(originalLine.replace(/\s*\{#[^}]+\}\s*$/u, ''))
      continue
    }

    output.push(originalLine.replace(/(\]\([^)]+\))\{[^}\n]*\}/g, '$1'))
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function rewriteUrl(
  rawUrl: string,
  canonicalUrl: string,
  humanToMarkdown: ReadonlyMap<string, string>,
): string {
  if (/^(?:#|mailto:|tel:|data:|javascript:)/i.test(rawUrl)) return rawUrl

  try {
    const resolved = new URL(rawUrl, canonicalUrl)
    if (resolved.origin === SITE_ORIGIN) {
      const markdownPath = humanToMarkdown.get(resolved.pathname)
      if (markdownPath) return `${SITE_ORIGIN}${markdownPath}${resolved.hash}`
    }
    return resolved.toString()
  } catch {
    return rawUrl
  }
}

function rewriteDocumentLinks(
  content: string,
  canonicalUrl: string,
  humanToMarkdown: ReadonlyMap<string, string>,
): string {
  const output: string[] = []
  let fence: { character: string; length: number } | undefined

  for (const originalLine of content.split('\n')) {
    const trimmed = originalLine.trim()
    const fenceMarker = trimmed.match(/^(`{3,}|~{3,})/)

    if (fence) {
      output.push(originalLine)
      if (
        fenceMarker
        && fenceMarker[1][0] === fence.character
        && fenceMarker[1].length >= fence.length
      ) {
        fence = undefined
      }
      continue
    }

    if (fenceMarker) {
      fence = { character: fenceMarker[1][0], length: fenceMarker[1].length }
      output.push(originalLine)
      continue
    }

    const rewrittenMarkdown = originalLine.replace(
      /(!?\[[^\]]*\])\(([^\s)]+)(\s+"[^"]*")?\)/g,
      (_match, label: string, url: string, title = '') => (
        `${label}(${rewriteUrl(url, canonicalUrl, humanToMarkdown)}${title})`
      ),
    )
    const rewrittenHtml = rewrittenMarkdown.replace(
      /\b(src|href)=(["'])([^"']+)\2/gi,
      (_match, attribute: string, quote: string, url: string) => (
        `${attribute}=${quote}${rewriteUrl(url, canonicalUrl, humanToMarkdown)}${quote}`
      ),
    )
    output.push(rewrittenHtml)
  }

  return output.join('\n')
}

function sectionKey(page: PageDraft): string {
  const route = page.sourceRelativePath.replace(/\/index\.md$/, '').replace(/\.md$/, '')
  if (route === 'index') return ''
  if (route.startsWith('articles/')) return 'articles'

  const [first, second] = route.split('/')
  return second ? `${first}/${second}` : first
}

function sectionKeyFromNavigationPath(rawPath: string, locale: Locale): string {
  const localePrefix = locale === 'en' ? '/en' : ''
  const withoutLocale = rawPath.startsWith(`${localePrefix}/`)
    ? rawPath.slice(localePrefix.length)
    : rawPath
  const route = withoutLocale.replace(/^\/+|\/+$/g, '')
  if (!route) return ''

  const [first, second] = route.split('/')
  return first === 'guide' && second ? `${first}/${second}` : first
}

function asNavigationItems(value: unknown): NavigationItem[] {
  if (Array.isArray(value)) return value as NavigationItem[]
  if (!value || typeof value !== 'object') return []

  const items = (value as NavigationItem).items
  return Array.isArray(items) ? items : []
}

export function getDocumentationSections(locale: Locale): DocumentationSection[] {
  const config = DOCS_CONFIGS[locale]
  const nav = asNavigationItems(config.themeConfig?.nav)
  const homePath = locale === 'en' ? '/en/' : '/'
  const home = nav.find((item) => item.link === homePath && item.text)
  if (!home?.text) {
    throw new Error(`Navigation does not define a home label for locale '${locale}'.`)
  }

  const sections: DocumentationSection[] = [{ key: '', label: home.text }]
  const seen = new Set([''])
  const sidebar = config.themeConfig?.sidebar
  if (!sidebar || Array.isArray(sidebar) || typeof sidebar !== 'object') return sections

  for (const [sidebarBase, rawGroup] of Object.entries(sidebar)) {
    const group = rawGroup as NavigationItem | NavigationItem[]
    const groupBase = !Array.isArray(group) && group.base ? group.base : sidebarBase

    for (const item of asNavigationItems(group)) {
      if (!item.text) continue
      const key = sectionKeyFromNavigationPath(item.base ?? groupBase, locale)
      if (seen.has(key)) continue
      sections.push({ key, label: item.text })
      seen.add(key)
    }
  }

  return sections
}

function markdownMetadata(page: PageDraft): string {
  return [
    '---',
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description)}`,
    `lang: ${page.locale}`,
    `canonical_url: ${JSON.stringify(page.canonicalUrl)}`,
    `markdown_url: ${JSON.stringify(page.markdownUrl)}`,
    `source_url: ${JSON.stringify(page.sourceUrl)}`,
    '---',
  ].join('\n')
}

function generateLlmsIndex(pages: PageDraft[], locale: Locale): string {
  const isRussian = locale === 'ru'
  const lines = [
    `# ${isRussian ? 'Разработка модов для «Мира танков»' : 'World of Tanks mod development'}`,
    '',
    `> ${isRussian
      ? 'Документация по созданию модификаций для игры «Мир танков»: Python 2.7, ActionScript 3, Gameface, ресурсы и дистрибуция модов.'
      : 'Documentation for creating World of Tanks modifications: Python 2.7, ActionScript 3, Gameface, game resources, and mod distribution.'}`,
    '',
    isRussian
      ? 'Ссылки ниже ведут на чистые Markdown-версии страниц. Русская версия является основной.'
      : 'The links below point directly to clean Markdown representations. Some English pages are translation placeholders; use the Russian index when a page is incomplete.',
    '',
    '## Context bundles',
    '',
    `- [${isRussian ? 'Полная документация' : 'Full documentation'}](${SITE_ORIGIN}${isRussian ? '' : '/en'}/llms-full.txt): ${isRussian ? 'все страницы на этом языке в одном файле.' : 'all pages in this language in one file.'}`,
  ]

  if (isRussian) {
    lines.push(
      `- [English documentation index](${SITE_ORIGIN}/en/llms.txt): English translations and translation placeholders.`,
    )
  } else {
    lines.push(
      `- [Russian documentation index](${SITE_ORIGIN}/llms.txt): canonical and most complete documentation.`,
    )
  }

  const grouped = new Map<string, PageDraft[]>()
  for (const page of pages) {
    const key = sectionKey(page)
    const group = grouped.get(key) ?? []
    group.push(page)
    grouped.set(key, group)
  }

  for (const { key, label } of getDocumentationSections(locale)) {
    const group = grouped.get(key)
    if (!group) continue

    lines.push('', `## ${label}`, '')
    for (const page of group.sort((a, b) => a.markdownPath.localeCompare(b.markdownPath))) {
      lines.push(`- [${page.title}](${page.markdownUrl}): ${page.description}`)
    }
    grouped.delete(key)
  }

  if (grouped.size) {
    throw new Error(
      `Documentation sections are missing from the '${locale}' sidebar: ${[...grouped.keys()].join(', ')}`,
    )
  }

  return `${lines.join('\n').trim()}\n`
}

function generateBundle(pages: PageDraft[], locale: Locale): string {
  const isRussian = locale === 'ru'

  const lines = [
    `# ${isRussian
      ? 'Полная документация по разработке модов'
      : 'Full mod development documentation'}`,
    '',
    `> ${isRussian ? 'Собрано из канонических Markdown-исходников.' : 'Built from the canonical Markdown sources.'}`,
  ]

  for (const page of pages) {
    lines.push(
      '',
      '---',
      '',
      `<!-- PAGE: ${page.markdownPath} -->`,
      '',
      `# ${page.title}`,
      '',
      `> Canonical URL: ${page.canonicalUrl}  `,
      `> Markdown URL: ${page.markdownUrl}  `,
      `> Source: ${page.sourceUrl}`,
      '',
      page.content.replace(/^#\s+.+\n+/, ''),
    )
  }

  return `${lines.join('\n').trim()}\n`
}

async function writeOutput(relativePath: string, content: string): Promise<void> {
  const destination = path.join(OUTPUT_ROOT, relativePath)
  await Bun.write(destination, content)
}

function containsOutsideCodeFences(content: string, pattern: RegExp): boolean {
  let fence: { character: string; length: number } | undefined

  for (const line of content.split('\n')) {
    const marker = line.trim().match(/^(`{3,}|~{3,})/)
    if (fence) {
      if (
        marker
        && marker[1][0] === fence.character
        && marker[1].length >= fence.length
        && /^(`{3,}|~{3,})\s*$/.test(line.trim())
      ) {
        fence = undefined
      }
      continue
    }

    if (marker) {
      fence = { character: marker[1][0], length: marker[1].length }
      continue
    }

    if (pattern.test(line)) return true
  }

  return false
}

function validateGeneratedContent(pages: PageDraft[], generatedFiles: ReadonlySet<string>): void {
  const failures: string[] = []

  for (const page of pages) {
    if (!generatedFiles.has(page.publishedRelativePath)) {
      failures.push(`Missing generated page: ${page.publishedRelativePath}`)
    }
    if (containsOutsideCodeFences(page.content, /^\s*:{3,}/)) {
      failures.push(`VitePress container remains: ${page.sourcePath}`)
    }
    if (containsOutsideCodeFences(page.content, /^\s*<</)) {
      failures.push(`VitePress code include remains: ${page.sourcePath}`)
    }
    if (containsOutsideCodeFences(page.content, /<!--\s*@include:/)) {
      failures.push(`VitePress include remains: ${page.sourcePath}`)
    }
    if (containsOutsideCodeFences(page.content, /<style\b/i)) {
      failures.push(`Style block remains: ${page.sourcePath}`)
    }
  }

  for (const required of [
    'llms.txt',
    'llms-full.txt',
    'en/llms.txt',
    'en/llms-full.txt',
  ]) {
    if (!generatedFiles.has(required)) failures.push(`Missing generated index: ${required}`)
  }

  if (failures.length) {
    throw new Error(`AI documentation validation failed:\n${failures.join('\n')}`)
  }
}

async function createDraft(locale: Locale, sourceRelativePath: string): Promise<PageDraft> {
  const sourcePath = path.join(DOCS_ROOT, locale, sourceRelativePath)
  const { attributes, body } = splitFrontmatter(await Bun.file(sourcePath).text())
  const expanded = await expandIncludes(body, sourcePath)
  const normalized = normalizeVitePressMarkdown(expanded)
  const publishedRelativePath = toPublishedRelativePath(locale, sourceRelativePath)
  const humanPath = toHumanPath(publishedRelativePath)
  const markdownPath = `/${publishedRelativePath}`
  const canonicalUrl = `${SITE_ORIGIN}${humanPath}`
  const title = extractTitle(normalized, locale, sourceRelativePath)

  return {
    locale,
    sourcePath,
    sourceRelativePath,
    publishedRelativePath,
    humanPath,
    markdownPath,
    canonicalUrl,
    markdownUrl: `${SITE_ORIGIN}${markdownPath}`,
    sourceUrl: `${REPOSITORY_URL}/blob/main/docs/${locale}/${sourceRelativePath}`,
    title,
    description: extractDescription(normalized, title, attributes.description),
    content: normalized,
  }
}

export async function buildAiDocs(): Promise<void> {
  if (!await Bun.file(path.join(OUTPUT_ROOT, 'index.html')).exists()) {
    throw new Error('VitePress output is missing. Run this generator after `vitepress build`.')
  }

  const drafts: PageDraft[] = []
  for (const locale of ['ru', 'en'] as const) {
    const files = await listMarkdownFiles(path.join(DOCS_ROOT, locale))
    drafts.push(...await Promise.all(files.map((file) => createDraft(locale, file))))
  }

  drafts.sort((a, b) => a.markdownPath.localeCompare(b.markdownPath))
  const humanToMarkdown = new Map(drafts.map((page) => [page.humanPath, page.markdownPath]))
  const pages = drafts.map((page) => ({
    ...page,
    content: rewriteDocumentLinks(page.content, page.canonicalUrl, humanToMarkdown),
  }))

  const generatedFiles = new Set<string>()
  for (const page of pages) {
    await writeOutput(
      page.publishedRelativePath,
      `${markdownMetadata(page)}\n\n${page.content}\n`,
    )
    generatedFiles.add(page.publishedRelativePath)
  }

  for (const locale of ['ru', 'en'] as const) {
    const localePages = pages.filter((page) => page.locale === locale)
    const prefix = locale === 'ru' ? '' : 'en/'
    const outputs = new Map([
      [`${prefix}llms.txt`, generateLlmsIndex(localePages, locale)],
      [`${prefix}llms-full.txt`, generateBundle(localePages, locale)],
    ])

    for (const [relativePath, content] of outputs) {
      await writeOutput(relativePath, content)
      generatedFiles.add(relativePath)
    }
  }

  validateGeneratedContent(pages, generatedFiles)

  const russianPages = pages.filter((page) => page.locale === 'ru').length
  const englishPages = pages.length - russianPages
  const fullSize = new Blob([generateBundle(
    pages.filter((page) => page.locale === 'ru'),
    'ru',
  )]).size
  console.log(
    `AI docs generated: ${russianPages} RU pages, ${englishPages} EN pages, RU full bundle ${Math.ceil(fullSize / 1024)} KiB`,
  )
}

if (import.meta.main) {
  await buildAiDocs()
}
