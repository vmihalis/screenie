# Phase 15: Documentation - Research

**Researched:** 2026-01-20
**Domain:** VitePress documentation site, Netlify deployment, CLI documentation
**Confidence:** HIGH

## Summary

This phase involves creating a VitePress documentation site for the screenie CLI tool, deployed to docs.screenie.xyz via Netlify. VitePress is the established choice for Vue ecosystem documentation and is well-suited for CLI documentation due to its simplicity, built-in search, and static site generation.

The documentation structure follows CLI documentation best practices: a getting started guide with copy-pasteable commands, comprehensive CLI reference documenting all flags from `screenie --help`, and practical examples. VitePress provides built-in local search using MiniSearch, eliminating the need for external search services.

**Primary recommendation:** Use VitePress with the default theme, built-in local search, and deploy to Netlify using `netlify.toml` configuration. Structure docs with three main sections: Getting Started, CLI Reference, and Examples.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitepress | @next (1.x) | Static site generator | Powers Vue, Vite, Vitest docs; ESM-native, fast |
| vue | ^3.4 | Required peer dependency | VitePress is built on Vue |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | ^5.0 | Type-safe config | Always - VitePress supports .ts config natively |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| VitePress | Docusaurus | React-based, heavier, more plugins but overkill for CLI docs |
| VitePress | MkDocs | Python ecosystem, not Node.js native |
| Built-in search | Algolia DocSearch | Free for open source but requires approval process; built-in is sufficient |

**Installation:**
```bash
npm add -D vitepress@next
```

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── .vitepress/
│   ├── config.ts          # Site configuration
│   ├── cache/             # Dev server cache (gitignored)
│   └── dist/              # Build output (gitignored)
├── public/
│   └── favicon.ico        # Static assets
├── index.md               # Home page (hero + features)
├── getting-started.md     # Installation and quick start
├── cli-reference.md       # All CLI options
├── examples.md            # Real-world usage examples
└── devices.md             # Device coverage reference (optional)
```

### Pattern 1: Home Page with Hero and Features
**What:** VitePress default theme provides a home page layout with hero section and feature cards
**When to use:** Landing page for documentation site
**Example:**
```yaml
# docs/index.md
---
layout: home
hero:
  name: screenie
  text: Responsive Screenshot CLI
  tagline: Capture 57 device viewports with one command
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/memehalis/screenie
features:
  - icon: 📱
    title: 57 Device Viewports
    details: Phones, tablets, and desktops from iPhone to 4K displays
  - icon: ⚡
    title: Parallel Capture
    details: Configurable concurrency for fast captures
  - icon: 📊
    title: HTML Report
    details: Visual grid of all captures, opens automatically
---
```
Source: https://vitepress.dev/reference/default-theme-home-page

### Pattern 2: Single Sidebar for Simple Docs
**What:** Array-based sidebar for linear navigation through docs
**When to use:** CLI documentation with 3-5 pages
**Example:**
```typescript
// docs/.vitepress/config.ts
export default defineConfig({
  themeConfig: {
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'CLI Reference', link: '/cli-reference' },
          { text: 'Examples', link: '/examples' },
          { text: 'Device Coverage', link: '/devices' }
        ]
      }
    ]
  }
})
```
Source: https://vitepress.dev/reference/default-theme-sidebar

### Pattern 3: Built-in Local Search
**What:** MiniSearch-powered full-text search without external services
**When to use:** Always for small-medium documentation sites
**Example:**
```typescript
// docs/.vitepress/config.ts
export default defineConfig({
  themeConfig: {
    search: {
      provider: 'local'
    }
  }
})
```
Source: https://vitepress.dev/reference/default-theme-search

### Pattern 4: CLI Reference Table Format
**What:** Document CLI options in a scannable table format
**When to use:** CLI reference pages
**Example:**
```markdown
## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--phones-only` | Only capture phone devices (24 devices) | all |
| `-c, --concurrency <n>` | Parallel captures (1-50) | auto |
| `-w, --wait <ms>` | Wait after page load | 0 |
```
Source: https://clig.dev/

### Anti-Patterns to Avoid
- **Deep nesting:** VitePress supports 6 levels but CLI docs rarely need more than 2
- **Multiple sidebars:** Overkill for a CLI tool with <10 pages
- **External search:** Algolia requires approval; built-in search is sufficient
- **Custom themes:** Default theme is polished; customization adds maintenance burden

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Site search | Custom search implementation | VitePress built-in local search | MiniSearch handles fuzzy matching, indexing, highlighting |
| Dark mode | CSS media query handling | VitePress appearance config | Built-in toggle, user preference persistence |
| Mobile nav | Custom hamburger menu | VitePress default theme | Responsive sidebar built-in |
| Code highlighting | Prism/highlight.js setup | VitePress Shiki integration | Zero-config syntax highlighting |
| Deployment config | Manual CI/CD scripts | Netlify + netlify.toml | Auto-deploys on push, preview deployments |

**Key insight:** VitePress default theme handles 95% of documentation needs. Focus on content, not infrastructure.

## Common Pitfalls

### Pitfall 1: ESM Module Configuration
**What goes wrong:** `require()` errors or module resolution failures
**Why it happens:** VitePress is ESM-only, requires `"type": "module"` in package.json
**How to avoid:**
- Use `.mts` extension for config: `config.mts`
- Or ensure package.json has `"type": "module"`
- Use `import`/`export` syntax, never `require()`
**Warning signs:** "Cannot use require() in ESM" errors

### Pitfall 2: Base URL Misconfiguration
**What goes wrong:** Assets and links break in production
**Why it happens:** Forgetting to set `base` when deploying to subdomain/subpath
**How to avoid:** For docs.screenie.xyz (root domain), `base: '/'` is correct (default)
**Warning signs:** 404s for CSS/JS in production, broken navigation

### Pitfall 3: Inconsistent CLI Documentation
**What goes wrong:** Docs say one thing, `--help` says another
**Why it happens:** Updating CLI without updating docs
**How to avoid:**
- Copy exact output from `screenie --help` into docs
- Document all 10 options shown in help output
- Keep examples runnable and tested
**Warning signs:** User issues about "flag doesn't exist"

### Pitfall 4: Missing Public Directory for Static Assets
**What goes wrong:** Favicons, images, OG images return 404
**Why it happens:** Assets must be in `docs/public/`, not referenced from project root
**How to avoid:** Place all static assets in `docs/public/`
**Warning signs:** Missing favicon, broken images in production

### Pitfall 5: Netlify Build Directory Mismatch
**What goes wrong:** Deployment shows default Netlify page or old content
**Why it happens:** Publish directory doesn't match VitePress output
**How to avoid:** Set `publish = "docs/.vitepress/dist"` in netlify.toml
**Warning signs:** Site doesn't update after pushes

## Code Examples

Verified patterns from official sources:

### Complete VitePress Config for CLI Documentation
```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'screenie',
  description: 'Capture responsive screenshots across 57 device viewports',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:title', content: 'screenie Documentation' }],
    ['meta', { property: 'og:description', content: 'Capture responsive screenshots across 57 device viewports' }],
    ['meta', { property: 'og:type', content: 'website' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'CLI Reference', link: '/cli-reference' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'CLI Reference', link: '/cli-reference' },
          { text: 'Examples', link: '/examples' },
          { text: 'Device Coverage', link: '/devices' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/memehalis/screenie' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024-present'
    }
  }
})
```
Source: https://vitepress.dev/reference/site-config, https://vitepress.dev/reference/default-theme-config

### Netlify Configuration
```toml
# netlify.toml
[build]
  publish = "docs/.vitepress/dist"
  command = "npm run docs:build"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/assets/*"
  [headers.values]
    cache-control = "max-age=31536000, immutable"
```
Source: https://github.com/vuejs/vitepress/blob/main/netlify.toml

### Package.json Scripts
```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```
Source: https://vitepress.dev/guide/getting-started

### Getting Started Page Structure
```markdown
# Getting Started

## Quick Start

Run without installation:

\`\`\`bash
npx screenie https://your-site.com
\`\`\`

Screenshots are saved to `./screenshots/` and an HTML report opens automatically.

## Installation

### Using npx (recommended)

No installation needed:

\`\`\`bash
npx screenie https://your-site.com
\`\`\`

### Global Install

For frequent use:

\`\`\`bash
npm install -g screenie
\`\`\`

Then run anywhere:

\`\`\`bash
screenie https://your-site.com
\`\`\`

## Requirements

- Node.js 20 or higher
- Chromium is installed automatically on first run
```
Source: https://clig.dev/ (CLI documentation best practices)

### CLI Reference Page Structure
```markdown
# CLI Reference

## Synopsis

\`\`\`
screenie [options] <url> [path]
\`\`\`

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `url` | Base URL to capture (e.g., http://localhost:3000) | Yes |
| `path` | Page path to capture | No (default: /) |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-V, --version` | Output version number | - |
| `--pages <paths...>` | Multiple page paths to capture | - |
| `-c, --concurrency <n>` | Parallel captures (1-50) | auto |
| `-w, --wait <ms>` | Wait after page load | 0 |
| `--phones-only` | Only capture phone devices | all |
| `--tablets-only` | Only capture tablet devices | all |
| `--desktops-only` | Only capture desktop devices | all |
| `-o, --output <dir>` | Output directory | ./screenshots |
| `--no-open` | Don't open report in browser | - |
| `-h, --help` | Display help | - |

## Examples

### Basic capture

\`\`\`bash
screenie https://example.com
\`\`\`

### Capture phones only

\`\`\`bash
screenie https://example.com --phones-only
\`\`\`
```
Source: CLI help output, https://clig.dev/

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| VuePress | VitePress | 2022+ | Vite-based, faster, ESM-native |
| Algolia DocSearch | Built-in local search | VitePress 0.66+ | No external service needed |
| Manual dark mode CSS | VitePress appearance config | Built-in | Zero-config toggle |

**Deprecated/outdated:**
- **VuePress 1.x:** Webpack-based, slower, Vue 2 - use VitePress instead
- **docsify:** Runtime rendering, no static generation - use VitePress for SEO

## Netlify Custom Domain Setup

For deploying to docs.screenie.xyz:

### DNS Configuration (External DNS)
1. Add custom domain `docs.screenie.xyz` in Netlify site settings
2. At your DNS provider, create a CNAME record:
   - Host: `docs`
   - Type: CNAME
   - Points to: `[your-netlify-site].netlify.app`
3. Wait up to 24 hours for DNS propagation
4. Netlify automatically provisions SSL certificate

Source: https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/

## Open Questions

Things that couldn't be fully resolved:

1. **Favicon/Logo Assets**
   - What we know: Need to place in docs/public/
   - What's unclear: Whether to create new assets or reuse from landing page
   - Recommendation: Create simple favicon, consider reusing OG image concept

2. **Device List Source**
   - What we know: README has comprehensive device list
   - What's unclear: Whether to duplicate or link to source
   - Recommendation: Create dedicated devices.md page with full list for SEO

## Sources

### Primary (HIGH confidence)
- https://vitepress.dev/guide/getting-started - Installation and setup
- https://vitepress.dev/reference/site-config - Configuration options
- https://vitepress.dev/reference/default-theme-config - Theme configuration
- https://vitepress.dev/reference/default-theme-home-page - Home page layout
- https://vitepress.dev/reference/default-theme-sidebar - Sidebar configuration
- https://vitepress.dev/reference/default-theme-search - Search configuration
- https://vitepress.dev/guide/deploy - Deployment including Netlify
- https://github.com/vuejs/vitepress/blob/main/netlify.toml - Official netlify.toml

### Secondary (MEDIUM confidence)
- https://clig.dev/ - CLI documentation best practices
- https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/ - Netlify DNS setup

### Tertiary (LOW confidence)
- None - all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - VitePress is the established choice, officially documented
- Architecture: HIGH - Pattern follows official VitePress docs and CLI best practices
- Pitfalls: HIGH - Verified against official troubleshooting and common issues
- Netlify deployment: HIGH - Official VitePress repo uses same configuration

**Research date:** 2026-01-20
**Valid until:** 2026-03-20 (90 days - VitePress is stable, slow-moving)
