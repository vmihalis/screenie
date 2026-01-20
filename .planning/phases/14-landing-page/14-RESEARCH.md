# Phase 14: Landing Page - Research

**Researched:** 2026-01-20
**Domain:** Vanilla HTML/CSS landing page with Netlify deployment
**Confidence:** HIGH

## Summary

This phase creates a high-performance landing page for screenie.xyz using vanilla HTML/CSS (per prior decision). The page must load under 1 second, achieve Lighthouse performance > 95, and convert visitors within 10 seconds through a clear hero section with demo GIF, copy-to-clipboard install command, and links to resources.

The stack is intentionally minimal: a single `index.html` file with inline CSS, using system fonts and the Catppuccin Mocha theme for visual consistency with the demo. No JavaScript framework needed - only a small clipboard script. Netlify deployment is straightforward for static HTML with the `netlify.toml` configuration file.

The demo GIF already exists (`demo/demo.gif`, 52KB, 850x450) from Phase 12, using the Catppuccin Mocha theme. This will be embedded above the fold without lazy loading to ensure immediate visibility.

**Primary recommendation:** Create a single `index.html` with inline critical CSS, system fonts, Catppuccin Mocha colors, centered hero layout, and deploy via Netlify with proper caching headers. Target total page weight under 100KB.

## Standard Stack

The established approach for this domain:

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Vanilla HTML5 | - | Page structure | Zero JS overhead, maximum performance, universal compatibility |
| Vanilla CSS3 | - | Styling | No framework bloat, full control, instant rendering |
| System fonts | - | Typography | Zero font loading time, native look, sub-millisecond render |
| Netlify | - | Hosting/CDN | Free tier, global CDN, automatic HTTPS, easy custom domains |

### Supporting
| Technology | Purpose | When to Use |
|------------|---------|-------------|
| `navigator.clipboard.writeText()` | Copy install command | Modern clipboard API - no library needed |
| Open Graph meta tags | Social sharing previews | Required for professional link sharing |
| Catppuccin Mocha | Color palette | Visual consistency with demo GIF |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla CSS | Pico.css (3.7KB) | Slightly more styling features, but adds dependency |
| System fonts | Inter/custom font | Better typography but +100-300KB and FOIT/FOUT issues |
| Inline CSS | External CSS file | Reduces HTML size but adds extra HTTP request |
| Netlify | GitHub Pages | Less features (no headers file, no redirects) |

**No installation required** - this is pure HTML/CSS.

## Architecture Patterns

### Recommended Project Structure
```
/home/memehalis/responsiveness-mcp/
  landing/                    # Landing page directory (publish folder)
    index.html               # Single page with inline CSS
    demo.gif                 # Copy from demo/demo.gif
    og-image.png             # Open Graph image (1200x630)
  netlify.toml               # Netlify configuration (project root)
  demo/
    demo.gif                 # Source demo (already exists)
```

### Pattern 1: Centered Hero Layout
**What:** Single-column centered layout as used by 90%+ of developer tool landing pages
**When to use:** CLI tools, developer-focused products, simple value propositions
**Example:**
```html
<!-- Source: Evil Martians dev tool landing page study -->
<main>
  <section class="hero">
    <h1>screenie</h1>
    <p class="tagline">Capture responsive design screenshots across 57 device viewports with one command.</p>
    <img src="demo.gif" alt="screenie CLI demo" class="demo">
    <div class="install">
      <code>npx screenie https://your-site.com</code>
      <button onclick="copyInstall()">Copy</button>
    </div>
    <nav class="links">
      <a href="https://github.com/memehalis/screenie">GitHub</a>
      <a href="https://www.npmjs.com/package/screenie">npm</a>
      <a href="#docs">Docs</a>
    </nav>
  </section>
</main>
```

### Pattern 2: System Font Stack
**What:** CSS font stack using native system fonts
**When to use:** Any project prioritizing performance over custom typography
**Example:**
```css
/* Source: GitHub, MVP.css, modern system font stacks */
:root {
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  --font-mono: ui-monospace, "Cascadia Mono", "Segoe UI Mono",
    "Liberation Mono", Menlo, Monaco, Consolas, monospace;
}

body {
  font-family: var(--font-family);
}

code, pre {
  font-family: var(--font-mono);
}
```

### Pattern 3: Catppuccin Mocha Color Variables
**What:** CSS custom properties with the Mocha palette
**When to use:** Matching the demo GIF theme, dark mode landing page
**Example:**
```css
/* Source: https://catppuccin.com/palette/ */
:root {
  /* Backgrounds */
  --ctp-base: #1e1e2e;
  --ctp-mantle: #181825;
  --ctp-crust: #11111b;

  /* Surfaces */
  --ctp-surface0: #313244;
  --ctp-surface1: #45475a;
  --ctp-surface2: #585b70;

  /* Text */
  --ctp-text: #cdd6f4;
  --ctp-subtext1: #bac2de;
  --ctp-subtext0: #a6adc8;

  /* Accents */
  --ctp-blue: #89b4fa;
  --ctp-green: #a6e3a1;
  --ctp-mauve: #cba6f7;
  --ctp-peach: #fab387;
  --ctp-pink: #f5c2e7;
  --ctp-teal: #94e2d5;
  --ctp-lavender: #b4befe;
  --ctp-sapphire: #74c7ec;
  --ctp-sky: #89dceb;
  --ctp-yellow: #f9e2af;
  --ctp-red: #f38ba8;
  --ctp-maroon: #eba0ac;
  --ctp-rosewater: #f5e0dc;
  --ctp-flamingo: #f2cdcd;
}
```

### Pattern 4: Copy-to-Clipboard Button
**What:** Modern async clipboard API with visual feedback
**When to use:** Install commands, code snippets
**Example:**
```html
<!-- Source: MDN Clipboard API docs -->
<script>
async function copyInstall() {
  const command = 'npx screenie https://your-site.com';
  try {
    await navigator.clipboard.writeText(command);
    // Visual feedback
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}
</script>
```

### Pattern 5: Performance-First Meta Tags
**What:** Complete head section for performance and SEO
**When to use:** Every landing page
**Example:**
```html
<!-- Source: web.dev, Open Graph protocol -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>screenie - Responsive Screenshot Tool</title>
  <meta name="description" content="Capture responsive design screenshots across 57 device viewports with one command.">

  <!-- Open Graph -->
  <meta property="og:title" content="screenie - Responsive Screenshot Tool">
  <meta property="og:description" content="Capture responsive design screenshots across 57 device viewports with one command.">
  <meta property="og:image" content="https://screenie.xyz/og-image.png">
  <meta property="og:url" content="https://screenie.xyz">
  <meta property="og:type" content="website">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="screenie - Responsive Screenshot Tool">
  <meta name="twitter:description" content="Capture responsive design screenshots across 57 device viewports with one command.">
  <meta name="twitter:image" content="https://screenie.xyz/og-image.png">

  <!-- Performance hints -->
  <link rel="preload" as="image" href="demo.gif">
</head>
```

### Anti-Patterns to Avoid
- **Lazy loading above-fold images:** The demo GIF is the hero - DO NOT use `loading="lazy"` on it; this hurts LCP
- **External fonts:** Google Fonts or similar adds 100-500ms to initial render
- **CSS frameworks:** Tailwind, Bootstrap etc. add 50KB+ for a single page
- **JavaScript frameworks:** React/Vue/etc. are massive overkill for a static landing page
- **Multiple HTTP requests:** Inline critical CSS, minimize external resources
- **Generic CTAs:** "Get Started" is weak; use "Copy command" or "Install now"

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard functionality | execCommand (deprecated) | navigator.clipboard.writeText() | Modern, async, cross-browser |
| CSS reset | Custom reset | Browser defaults or minimal normalize | Modern browsers are consistent enough |
| Responsive layout | Custom media queries | CSS clamp() for fluid sizing | Single line handles all breakpoints |
| Dark theme | Custom color calculations | Catppuccin palette (pre-designed) | Harmonious, tested color relationships |
| Hosting configuration | Custom server | Netlify static hosting | CDN, HTTPS, headers all handled |

**Key insight:** A vanilla HTML/CSS landing page doesn't need libraries. The browser provides everything: CSS Grid, Flexbox, CSS variables, clipboard API, native form validation.

## Common Pitfalls

### Pitfall 1: Lazy Loading Hero Image
**What goes wrong:** Demo GIF loads with delay, hurting LCP score
**Why it happens:** Applying lazy loading globally to all images
**How to avoid:** Never use `loading="lazy"` on above-fold content; preload hero image
**Warning signs:** Lighthouse LCP score drops, demo visibly pops in

### Pitfall 2: External Font Loading
**What goes wrong:** FOIT/FOUT flashes, 200-500ms render delay
**Why it happens:** Using Google Fonts or self-hosted fonts
**How to avoid:** Use system font stack exclusively
**Warning signs:** Text invisible then appears (FOIT) or changes style (FOUT)

### Pitfall 3: Non-HTTPS Assets
**What goes wrong:** Mixed content warnings, broken images
**Why it happens:** Using http:// URLs for assets
**How to avoid:** All URLs use https:// or relative paths
**Warning signs:** Browser security warnings, broken images on production

### Pitfall 4: Missing Open Graph Image
**What goes wrong:** Ugly or default preview when page shared on social media
**Why it happens:** Forgetting to create og:image or wrong dimensions
**How to avoid:** Create 1200x630 PNG, test with Open Graph debuggers
**Warning signs:** Plain text previews on Twitter/LinkedIn/Slack

### Pitfall 5: DNS Propagation Delays
**What goes wrong:** Custom domain doesn't work immediately
**Why it happens:** DNS changes take up to 48 hours to propagate
**How to avoid:** Set up DNS early, verify with `dig` command
**Warning signs:** Domain works intermittently or not at all

### Pitfall 6: Missing Cache Headers
**What goes wrong:** Repeat visitors still download static assets
**Why it happens:** Not configuring Netlify headers for immutable assets
**How to avoid:** Add `_headers` file with Cache-Control directives
**Warning signs:** Lighthouse flags caching issues

### Pitfall 7: GIF Too Large for Mobile
**What goes wrong:** Page exceeds data budget on mobile, slow LCP
**Why it happens:** GIF is larger than expected
**How to avoid:** Current demo.gif is 52KB - already optimized. If larger, convert to video/WebP
**Warning signs:** LCP > 2.5s on mobile, total page size > 500KB

## Code Examples

Verified patterns for this phase:

### Complete index.html Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>screenie - Responsive Screenshot Tool</title>
  <meta name="description" content="Capture responsive design screenshots across 57 device viewports with one command.">

  <!-- Open Graph -->
  <meta property="og:title" content="screenie">
  <meta property="og:description" content="Capture responsive design screenshots across 57 device viewports with one command.">
  <meta property="og:image" content="https://screenie.xyz/og-image.png">
  <meta property="og:url" content="https://screenie.xyz">
  <meta property="og:type" content="website">

  <!-- Performance -->
  <link rel="preload" as="image" href="demo.gif">

  <style>
    /* Catppuccin Mocha colors */
    :root {
      --ctp-base: #1e1e2e;
      --ctp-surface0: #313244;
      --ctp-text: #cdd6f4;
      --ctp-subtext0: #a6adc8;
      --ctp-blue: #89b4fa;
      --ctp-green: #a6e3a1;
      --ctp-mauve: #cba6f7;
    }

    /* Reset & base */
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--ctp-base);
      color: var(--ctp-text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    /* Hero section */
    .hero {
      max-width: 900px;
      text-align: center;
    }

    h1 {
      font-size: clamp(2.5rem, 8vw, 4rem);
      margin-bottom: 0.5rem;
      color: var(--ctp-mauve);
    }

    .tagline {
      font-size: clamp(1rem, 3vw, 1.25rem);
      color: var(--ctp-subtext0);
      margin-bottom: 2rem;
    }

    /* Demo GIF */
    .demo {
      width: 100%;
      max-width: 850px;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    /* Install command */
    .install {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .install code {
      font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
      background: var(--ctp-surface0);
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-size: 1rem;
    }

    .install button {
      background: var(--ctp-blue);
      color: var(--ctp-base);
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: opacity 0.2s;
    }

    .install button:hover { opacity: 0.9; }

    /* Links */
    .links {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .links a {
      color: var(--ctp-blue);
      text-decoration: none;
    }

    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <main class="hero">
    <h1>screenie</h1>
    <p class="tagline">Capture responsive design screenshots across 57 device viewports with one command.</p>
    <img src="demo.gif" alt="screenie capturing responsive screenshots" class="demo">
    <div class="install">
      <code id="cmd">npx screenie https://your-site.com</code>
      <button onclick="copyInstall()">Copy</button>
    </div>
    <nav class="links">
      <a href="https://github.com/memehalis/screenie">GitHub</a>
      <a href="https://www.npmjs.com/package/screenie">npm</a>
    </nav>
  </main>

  <script>
    async function copyInstall() {
      const cmd = document.getElementById('cmd').textContent;
      try {
        await navigator.clipboard.writeText(cmd);
        const btn = event.target;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  </script>
</body>
</html>
```

### netlify.toml Configuration
```toml
# Source: Netlify docs
# https://docs.netlify.com/configure-builds/file-based-configuration/

[build]
  publish = "landing"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/*.gif"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Redirect www to apex domain
[[redirects]]
  from = "https://www.screenie.xyz/*"
  to = "https://screenie.xyz/:splat"
  status = 301
  force = true
```

### Alternative: _headers File
```
# Place in landing/ directory
/*.gif
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

## Netlify Deployment Steps

### Option A: Netlify DNS (Recommended)
1. Connect GitHub repo to Netlify
2. Set publish directory to `landing`
3. Go to Domain Management > Add custom domain > `screenie.xyz`
4. Select "Set up Netlify DNS"
5. Update domain registrar nameservers to Netlify's:
   - `dns1.p0X.nsone.net` (specific servers shown in Netlify UI)
6. Wait for DNS propagation (usually 1-24 hours)

### Option B: External DNS
1. Connect GitHub repo to Netlify
2. Set publish directory to `landing`
3. Go to Domain Management > Add custom domain > `screenie.xyz`
4. At your DNS provider, add:
   - A record: `screenie.xyz` -> `75.2.60.5`
   - CNAME record: `www.screenie.xyz` -> `your-site.netlify.app`
5. Wait for DNS propagation

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery clipboard plugins | navigator.clipboard API | 2018 | Native, no dependencies |
| Google Fonts | System font stacks | 2020+ | 200-500ms faster initial render |
| CSS frameworks | Vanilla CSS with variables | 2022+ | 50-100KB savings |
| document.execCommand('copy') | navigator.clipboard.writeText() | 2020 | Async, more reliable |
| FTP deployment | Git-based Netlify deploy | 2017+ | Automatic, CI/CD built-in |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Still works but deprecated; use Clipboard API
- Flash of Invisible Text (FOIT): Avoided entirely with system fonts
- jQuery: Never needed for simple landing pages

## Open Questions

Things that couldn't be fully resolved:

1. **Open Graph image creation**
   - What we know: Need 1200x630 PNG for social previews
   - What's unclear: Best tool/approach to create it
   - Recommendation: Screenshot the landing page at 1200x630 or create simple graphic with logo/tagline

2. **Exact Netlify nameservers**
   - What we know: Netlify DNS uses nsone.net nameservers
   - What's unclear: Specific nameservers assigned (shown after setup)
   - Recommendation: Follow Netlify UI prompts during setup

3. **Domain registration status**
   - What we know: screenie.xyz is the target domain
   - What's unclear: Whether domain is already registered
   - Recommendation: Verify domain ownership before deployment

## Sources

### Primary (HIGH confidence)
- [Netlify Configuration Docs](https://docs.netlify.com/configure-builds/file-based-configuration/) - netlify.toml reference
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) - writeText() method
- [Catppuccin Palette](https://catppuccin.com/palette/) - Official Mocha hex codes
- [Open Graph Protocol](https://ogp.me/) - Required meta tags

### Secondary (MEDIUM confidence)
- [Chrome Lighthouse Docs](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) - Scoring methodology
- [web.dev Performance](https://web.dev/articles/lazy-loading-video) - Above-fold best practices
- [Evil Martians Dev Tool Study](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025) - Hero section patterns
- [Netlify Custom Domains](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/) - DNS setup

### Tertiary (LOW confidence)
- WebSearch results for Lighthouse optimization - general guidance verified with official docs
- WebSearch results for landing page design trends - design opinions, not technical facts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vanilla HTML/CSS is well-understood, Netlify extensively documented
- Architecture: HIGH - Patterns verified with official sources and Phase 12 research
- Pitfalls: HIGH - Based on Lighthouse documentation and web.dev best practices
- Deployment: MEDIUM - Exact steps depend on domain registrar and Netlify UI changes

**Research date:** 2026-01-20
**Valid until:** 2026-07-20 (stable technologies, low churn)

---

## Quick Reference

**Target metrics:**
- Page load: < 1 second
- Lighthouse Performance: > 95
- Total page weight: < 100KB
- LCP: < 1.5 seconds

**Files to create:**
1. `landing/index.html` - Main page with inline CSS
2. `landing/demo.gif` - Copy from demo/demo.gif (52KB)
3. `landing/og-image.png` - Social preview image (1200x630)
4. `netlify.toml` - Build and headers configuration

**Demo GIF status:**
- Location: `/home/memehalis/responsiveness-mcp/demo/demo.gif`
- Size: 52KB (well under 5MB limit)
- Dimensions: 850x450
- Theme: Catppuccin Mocha
