import { Glob } from 'bun';
import { AdditionalConfig } from 'vitepress';
import mainConfig from "../.vitepress/config.mjs";

const locales = new Map<string, string>(Object.entries(mainConfig.locales as Record<string, any>).map(([key, value]) => [key, value.lang || 'unknown']));

const rootLang = locales.get('root');
if (rootLang) {
  locales.set(rootLang, rootLang);
  locales.delete('root');
}

const configs = new Map<string, string>(
  [...new Glob('**/config.ts').scanSync({ cwd: 'docs' })].map(path => {
    const locale = path.split('/');

    if (locale.length < 2) return [rootLang!, path]
    return [locale[0]!, path]
  })
)

type SidebarNode = {
  text?: string;
  base?: string;
  link?: string;
  items?: SidebarNode[];
  collapsed?: boolean;
};

type SidebarConfig = Record<string, SidebarNode>;

export function collectFullPaths(config: SidebarConfig): string[] {
  const acc = new Set<string>();

  const stripTrailing = (s: string) => s.replace(/\/+$/, "");
  const ensureLeading = (s: string) => (s.startsWith("/") ? s : `/${s}`);

  const normalizeBase = (b?: string) => stripTrailing(ensureLeading(b ?? ""));

  const joinBaseAndLink = (base: string, link: string): string => {
    const b = normalizeBase(base);
    const keepTrailing = /\/$/.test(link);

    // If link already looks full (starts with the base), keep as-is.
    const ln = stripTrailing(link);
    if (b && (ln === b || ln.startsWith(`${b}/`))) {
      return keepTrailing ? `${stripTrailing(link)}/` : ensureLeading(link);
    }

    // Otherwise, treat as relative to base (even if it begins with '/')
    const rel = link.replace(/^\/+/, ""); // remove leading slashes
    let out = `${b}/${rel}`.replace(/\/{2,}/g, "/");
    if (!out.startsWith("/")) out = `/${out}`;
    return keepTrailing ? `${stripTrailing(out)}/` : out;
  };

  const walk = (node: SidebarNode, currentBase: string) => {
    const nextBase = node.base ?? currentBase;

    if (node.link) {
      acc.add(joinBaseAndLink(nextBase, node.link));
    }
    if (node.items) {
      for (const child of node.items) walk(child, nextBase);
    }
  };

  for (const section of Object.values(config)) {
    walk(section, section.base ?? "");
  }

  return Array.from(acc);
}


const paths = await Promise.all([...locales.entries()].map(async ([locale, lang]) => {
  const configPath = configs.get(locale);
  if (!configPath) return { locale, lang, items: [] };
  const configModule = await import(`../docs/${configPath}`);
  const config = configModule.default as AdditionalConfig<NoInfer<any>>;

  const sidebar = config.themeConfig?.sidebar;
  const items = collectFullPaths(sidebar as SidebarConfig).map(p => p.replace(`/${locale}/`, '/')).sort();
  return { locale, lang, items };
}))

// find missing paths
const allPaths = new Set<string>(paths.flatMap(p => p.items))
const missingPaths = paths.map(p => {
  const missing = [];
  for (const path of allPaths) {
    if (!p.items.includes(path)) missing.push(path)
  }

  return { locale: p.locale, lang: p.lang, missing };
})

let output = ``;
for (const element of missingPaths) {
  if (element.missing.length === 0) continue
  else {
    output += `Missing pages for locale '${element.locale}' (${element.lang}):\n`;
    for (const path of element.missing) output += `  ${path}\n`;
  }
}

const hasErrors = missingPaths.some(p => p.missing.length > 0);
if (hasErrors) {
  console.error(output);
  process.exit(1);
} else {
  console.log("Localization check passed: all locales have the same set of pages.");
}


