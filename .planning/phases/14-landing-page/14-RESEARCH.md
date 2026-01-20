# Phase 14: Landing Page - Research

**Researched:** 2026-01-20
**Domain:** Static landing page with vanilla HTML/CSS, Netlify deployment
**Confidence:** HIGH

## Summary

This phase creates a simple, fast-loading landing page for screenie.xyz that converts visitors to users within 10 seconds. The approach uses vanilla HTML/CSS (no framework) to achieve maximum performance, targeting Lighthouse score 95+.

The existing demo GIF (51KB) is already well-optimized. The landing page needs: hero section with tagline, demo visualization, one-click install command copy, and links to GitHub/npm/docs. Deployment via Netlify with custom domain configuration.

**Primary recommendation:** Build a single-file HTML page with inline critical CSS, system fonts, copy-to-clipboard via Clipboard API, and deploy through Netlify with proper DNS configuration for screenie.xyz.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Vanilla HTML5 | - | Page structure | Zero build, fastest load, no dependencies |
| Vanilla CSS3 | - | Styling | Inline critical CSS, no render-blocking |
| Clipboard API | Native | Copy functionality | Modern browsers (Chrome 66+, Firefox 63+, Safari 13.1+) |
| Netlify | - | Hosting | Free tier, auto-SSL, CDN, custom domains |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| FFmpeg | GIF to MP4/WebM conversion | If demo needs video format optimization |
| gifsicle | GIF compression | Already used - demo at 51KB is excellent |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla HTML/CSS | React/Next.js | Framework adds bundle size, build complexity for single page |
| System fonts | Google Fonts | Network request, FOUT/FOIT, slower LCP |
| MP4/WebM video | GIF | Video is 80-90% smaller, but 51KB GIF is already optimal |

**Installation:**
```bash
# No npm packages needed for landing page
# Netlify CLI (optional, for local testing)
npm install -g netlify-cli
```

## Architecture Patterns

### Recommended Project Structure
```
site/
  index.html          # Single-page landing (includes inline CSS)
  demo.gif            # Copy from demo/ folder (or convert to video)
  og-image.png        # Open Graph social preview image (1200x630)
  favicon.ico         # Browser tab icon
netlify.toml          # Deployment configuration (in repo root)
```

### Pattern 1: Single-File Landing Page
**What:** All HTML and CSS in one file with no external dependencies
**When to use:** Simple marketing/landing pages where performance is critical
**Why:** Eliminates render-blocking requests, enables instant first paint

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>screenie - Responsive Screenshots in One Command</title>

  <!-- Critical CSS inlined -->
  <style>
    /* All styles here - no external stylesheet */
  </style>
</head>
<body>
  <!-- Content -->
</body>
</html>
```

### Pattern 2: System Font Stack
**What:** Use operating system fonts instead of web fonts
**When to use:** When performance matters more than custom typography
**Example:**
```css
/* Source: https://systemfontstack.com/ */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* Monospace for code blocks */
code, pre {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo,
               Consolas, "Liberation Mono", monospace;
}
```

### Pattern 3: Clipboard API for Copy Button
**What:** Modern async clipboard API with visual feedback
**When to use:** Copy-to-clipboard functionality
**Example:**
```javascript
// Source: https://web.dev/patterns/clipboard/copy-text
async function copyInstallCommand() {
  const command = 'npx screenie https://your-site.com';
  const button = document.getElementById('copy-btn');

  try {
    await navigator.clipboard.writeText(command);
    button.textContent = 'Copied!';
    setTimeout(() => button.textContent = 'Copy', 2000);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = command;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    button.textContent = 'Copied!';
    setTimeout(() => button.textContent = 'Copy', 2000);
  }
}
```

### Pattern 4: Dark Mode Support
**What:** Respect user's system color scheme preference
**When to use:** Modern landing pages for developer tools
**Example:**
```css
/* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme */
:root {
  --bg: #ffffff;
  --text: #1a1a2e;
  --accent: #6366f1;
  --code-bg: #f3f4f6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a2e;
    --text: #f9fafb;
    --accent: #818cf8;
    --code-bg: #1e293b;
  }
}

body {
  background: var(--bg);
  color: var(--text);
}
```

### Anti-Patterns to Avoid
- **External CSS file for single page:** Adds render-blocking request
- **Google Fonts:** Network request delays LCP, causes FOUT
- **Heavy JavaScript frameworks:** React/Vue add 30-100KB+ for a static page
- **Large uncompressed images:** Demo GIF at 51KB is already good
- **Third-party analytics on landing:** Defer or avoid for performance

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Copy to clipboard | Custom DOM manipulation | `navigator.clipboard.writeText()` | Standard API, async, handles permissions |
| GIF animation | Custom video player | `<img>` for GIF or `<video autoplay loop muted>` | Native browser handling |
| Responsive layout | Custom JS resize handlers | CSS Grid/Flexbox + media queries | Pure CSS, no JS needed |
| Dark mode | Custom toggle storage | `prefers-color-scheme` media query | Respects system preference automatically |
| SSL certificates | Manual cert management | Netlify auto-SSL | Free Let's Encrypt, auto-renewal |

**Key insight:** For a single landing page, every dependency adds complexity. Native browser APIs and CSS handle everything needed.

## Common Pitfalls

### Pitfall 1: Render-Blocking Resources
**What goes wrong:** External CSS/JS files delay first paint
**Why it happens:** Browser must download and parse before rendering
**How to avoid:** Inline all critical CSS in `<style>` tag, defer non-critical JS
**Warning signs:** Lighthouse flags "Eliminate render-blocking resources"

### Pitfall 2: Large Images Above the Fold
**What goes wrong:** LCP (Largest Contentful Paint) fails, slow perceived load
**Why it happens:** Demo GIF/video is the largest element and blocks rendering
**How to avoid:**
- Keep GIF under 100KB (current 51KB is excellent)
- Add explicit `width` and `height` attributes to prevent layout shift
- Consider `loading="eager"` for above-fold images
**Warning signs:** LCP > 2.5s, CLS > 0.1

### Pitfall 3: Missing Meta Tags
**What goes wrong:** Poor social sharing appearance, SEO issues
**Why it happens:** Forgetting Open Graph and Twitter Card tags
**How to avoid:** Include all essential meta tags (see Code Examples)
**Warning signs:** Blank previews when sharing on Twitter/LinkedIn

### Pitfall 4: Clipboard API HTTPS Requirement
**What goes wrong:** Copy button fails silently
**Why it happens:** Clipboard API requires secure context (HTTPS)
**How to avoid:** Netlify provides free HTTPS; test on deployed site, not `file://`
**Warning signs:** Copy works locally with `localhost` but fails on `file://`

### Pitfall 5: DNS Propagation Delays
**What goes wrong:** Custom domain doesn't resolve after configuration
**Why it happens:** DNS changes take 24-48 hours to propagate globally
**How to avoid:** Configure DNS early, use `dig` command to verify propagation
**Warning signs:** "DNS_PROBE_FINISHED_NXDOMAIN" errors

### Pitfall 6: Missing Favicon
**What goes wrong:** 404 errors in console, unprofessional appearance
**Why it happens:** Browsers request favicon.ico automatically
**How to avoid:** Create simple favicon, add `<link rel="icon">` tag
**Warning signs:** Console shows 404 for /favicon.ico

## Code Examples

Verified patterns from official sources:

### Complete HTML Head Section
```html
<!-- Source: https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>screenie - Responsive Screenshots in One Command</title>
  <meta name="title" content="screenie - Responsive Screenshots in One Command">
  <meta name="description" content="Capture responsive design screenshots across 57 device viewports with one command. No setup required.">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://screenie.xyz/">
  <meta property="og:title" content="screenie - Responsive Screenshots in One Command">
  <meta property="og:description" content="Capture responsive design screenshots across 57 device viewports with one command.">
  <meta property="og:image" content="https://screenie.xyz/og-image.png">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://screenie.xyz/">
  <meta name="twitter:title" content="screenie - Responsive Screenshots in One Command">
  <meta name="twitter:description" content="Capture responsive design screenshots across 57 device viewports with one command.">
  <meta name="twitter:image" content="https://screenie.xyz/og-image.png">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
```

### Hero Section Structure
```html
<!-- Source: Semantic HTML best practices -->
<main>
  <section class="hero">
    <h1>screenie</h1>
    <p class="tagline">Capture responsive design screenshots across 57 device viewports with one command</p>

    <div class="install-box">
      <code id="install-cmd">npx screenie https://your-site.com</code>
      <button id="copy-btn" onclick="copyInstallCommand()">Copy</button>
    </div>

    <img src="demo.gif" alt="screenie CLI capturing responsive screenshots"
         width="850" height="480" loading="eager">

    <nav class="links">
      <a href="https://github.com/memehalis/screenie">GitHub</a>
      <a href="https://www.npmjs.com/package/screenie">npm</a>
    </nav>
  </section>
</main>
```

### netlify.toml Configuration
```toml
# Source: https://docs.netlify.com/build/configure-builds/file-based-configuration/
[build]
  publish = "site/"
  command = "echo 'Static site - no build needed'"

# Redirect www to apex domain
[[redirects]]
  from = "https://www.screenie.xyz/*"
  to = "https://screenie.xyz/:splat"
  status = 301
  force = true

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets
[[headers]]
  for = "/*.gif"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Minimal CSS Reset + Base Styles
```css
/* Source: Modern CSS best practices 2026 */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  min-height: 100vh;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font: inherit;
  cursor: pointer;
  border: none;
  background: none;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | 2018-2019 | Async, better UX, permission-aware |
| Google Fonts everywhere | System font stack | 2020+ | Faster LCP, no FOUT |
| Frameworks for everything | Vanilla for simple pages | 2022+ | Better Core Web Vitals |
| GIF for all animations | Video (MP4/WebM) | 2018+ | 80-90% smaller files (but 51KB GIF is fine) |
| Manual dark mode toggle | `prefers-color-scheme` | 2019+ | Automatic system preference |
| Manual SSL certificates | Netlify auto-SSL | 2015+ | Free, automatic renewal |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Still works as fallback but deprecated
- Flash-based clipboard: Long dead (2020)
- HTTP without SSL: Penalized by browsers, required for Clipboard API

## Open Questions

Things that couldn't be fully resolved:

1. **OG Image Design**
   - What we know: 1200x630 recommended, PNG format
   - What's unclear: Exact design/content for screenie's OG image
   - Recommendation: Create simple branded image with logo and tagline

2. **Favicon Design**
   - What we know: .ico format, multiple sizes (16x16, 32x32)
   - What's unclear: Whether to use simple text "S" or custom icon
   - Recommendation: Simple design, can be text-based

3. **Domain DNS Configuration**
   - What we know: Need A record pointing to 75.2.60.5 for apex domain
   - What's unclear: Current domain registrar for screenie.xyz
   - Recommendation: Document both Netlify DNS and external DNS approaches

## Sources

### Primary (HIGH confidence)
- [Netlify Custom Domains Documentation](https://docs.netlify.com/domains-https/custom-domains/) - DNS configuration, deployment
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) - Copy functionality
- [MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) - Dark mode
- [web.dev Copy Text Pattern](https://web.dev/patterns/clipboard/copy-text) - Clipboard implementation
- [Chrome Lighthouse Performance](https://developer.chrome.com/docs/lighthouse/performance/efficient-animated-content/) - GIF to video guidance

### Secondary (MEDIUM confidence)
- [System Font Stack](https://systemfontstack.com/) - Modern font stack recommendations
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started) - Social meta tags
- [Netlify File-Based Configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/) - netlify.toml syntax

### Tertiary (LOW confidence)
- Various landing page examples from WebSearch - Design patterns only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vanilla HTML/CSS is well-documented, Netlify docs are authoritative
- Architecture: HIGH - Single-file pattern is standard for performance-critical landing pages
- Pitfalls: HIGH - Based on Lighthouse documentation and Netlify official guides
- Code examples: HIGH - From MDN, web.dev, and official Netlify docs

**Research date:** 2026-01-20
**Valid until:** 2026-03-20 (60 days - stable technologies)
