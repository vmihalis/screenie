# Phase 16: Publish - Research

**Researched:** 2026-01-20
**Domain:** npm package publishing, supply chain security, package discoverability
**Confidence:** HIGH

## Summary

Phase 16 focuses on publishing the "screenie" package to npm with provenance signing for supply chain security. The research reveals that npm publishing in 2026 has evolved significantly with the introduction of **trusted publishing** (generally available since July 2025) and mandatory provenance attestations. The standard approach now uses OpenID Connect (OIDC) authentication via GitHub Actions, eliminating the need for long-lived npm tokens while automatically generating cryptographic signatures via Sigstore.

The package is already well-configured for publishing with proper metadata (name: "screenie", files whitelist: ["dist"], MIT license, keywords, description). The critical implementation requires setting up a GitHub Actions workflow triggered on release events with `id-token: write` permissions to enable trusted publishing.

**Key 2026 changes:** npm deprecated all classic tokens in December 2025, introduced 90-day maximum token lifetime with mandatory 2FA, and made trusted publishing the recommended approach. Provenance attestations are now displayed as green checkmarks on npmjs.com and verifiable via `npm audit signatures`.

**Primary recommendation:** Use npm trusted publishing with GitHub Actions (OIDC authentication) to publish with automatic provenance attestations, triggered on release creation, eliminating token security risks.

## Standard Stack

The established tools for npm publishing with provenance signing:

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| npm CLI | 11.5.1+ | Package manager with trusted publishing | Required minimum for OIDC trusted publishing (2026 standard) |
| GitHub Actions | N/A | CI/CD platform for automated publishing | Native OIDC support, Sigstore integration, npm-verified provider |
| Sigstore | Public good | Cryptographic signing infrastructure | Industry standard for supply chain security, zero-config with npm |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| semantic-release | Latest | Automated versioning and changelog | When using conventional commits for automated version bumps |
| npm-publish action | v4+ | Third-party publish action | Alternative to npm CLI when needing additional features |
| bundlephobia | N/A | Package size analysis | Pre-publish size optimization verification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Trusted publishing (OIDC) | Granular access tokens | Tokens: 90-day max lifetime, require rotation, security risk if exposed; OIDC: zero-config, no rotation needed |
| GitHub Actions | GitLab CI/CD | GitLab also supports trusted publishing but GitHub Actions has wider ecosystem adoption |
| `--provenance` flag | Trusted publishing auto-provenance | Trusted publishing generates provenance automatically without flag |

**Installation:**
```bash
# Ensure npm CLI is up to date
npm install -g npm@latest

# Verify version supports trusted publishing
npm --version  # Should be 11.5.1 or later
```

## Architecture Patterns

### Recommended Workflow Structure
```
.github/
└── workflows/
    └── publish.yml        # Triggered on release:published event
.planning/
└── phases/
    └── 16-publish/
package.json               # Must include: name, version, files, bin, license, keywords, description
dist/
└── cli.js                # Built output with #!/usr/bin/env node shebang
```

### Pattern 1: Release-Triggered Publishing with Trusted Publishing
**What:** GitHub Actions workflow triggered when a GitHub release is published, uses OIDC for token-free npm authentication
**When to use:** Standard approach for 2026 - eliminates token management, provides automatic provenance
**Example:**
```yaml
# Source: https://docs.npmjs.com/trusted-publishers/ and https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/
name: Publish to npm

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write  # CRITICAL: enables OIDC token generation

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci

      - run: npm publish --access public
        # No NODE_AUTH_TOKEN needed - OIDC authenticates automatically
        # No --provenance flag needed - automatic with trusted publishing
```

### Pattern 2: Pre-Publish Validation via prepublishOnly Script
**What:** npm lifecycle script that runs before `npm publish` to ensure quality gates
**When to use:** Always - prevents publishing broken packages
**Example:**
```json
// Source: https://docs.npmjs.com/cli/v6/using-npm/scripts/
{
  "scripts": {
    "prepublishOnly": "npm run build && npm run test"
  }
}
```

### Pattern 3: Files Whitelist for Security
**What:** Explicit `files` array in package.json defining what gets published
**When to use:** Always - prevents accidental secret leakage
**Example:**
```json
// Source: https://docs.npmjs.com/cli/v7/configuring-npm/package-json/
{
  "files": [
    "dist"
  ]
}
```

### Anti-Patterns to Avoid
- **Using .npmignore:** Overrides .gitignore and can leak secrets; use `files` whitelist instead
- **Long-lived tokens:** Deprecated Dec 2025, max 90-day lifetime, use trusted publishing
- **Missing id-token permission:** Workflow will fail OIDC authentication without `id-token: write`
- **Empty NODE_AUTH_TOKEN:** Setting to empty string prevents OIDC fallback; must be completely unset for trusted publishing
- **Publishing without tests:** Use `prepublishOnly` to enforce build and test before publish
- **Scoped packages without --access public:** Free npm accounts must explicitly set access for scoped packages

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version bumping | Manual package.json editing | `npm version` command or semantic-release | npm version updates package.json AND creates git tag atomically; semantic-release automates based on commit messages |
| Cryptographic signing | Custom signing infrastructure | npm trusted publishing + Sigstore | Sigstore is public good infrastructure, zero-config, industry standard for SLSA compliance |
| Provenance attestations | Custom build metadata | npm --provenance or trusted publishing | SLSA-compliant format, Rekor transparency log, npm-native verification |
| Token rotation | Manual secret management | Trusted publishing (OIDC) | Short-lived tokens generated per workflow run, zero management overhead |
| Publishing workflow | Custom bash scripts | GitHub Actions with npm publish | Native OIDC integration, audit logs, reusable workflow marketplace |

**Key insight:** npm publishing security in 2026 is a solved problem via trusted publishing. Custom solutions miss critical features (Sigstore integration, SLSA compliance, transparency logs, npm audit signatures verification) and increase attack surface.

## Common Pitfalls

### Pitfall 1: Trusted Publisher Configuration Mismatch
**What goes wrong:** Workflow fails with "Unable to authenticate" despite correct permissions
**Why it happens:** Case-sensitive exact match required between npmjs.com trusted publisher config and actual workflow details
**How to avoid:**
- Workflow filename on npmjs.com must include .yml extension (e.g., `publish.yml` not `publish`)
- Repository name is case-sensitive
- If using reusable workflows, specify the CALLER workflow (the one triggered by release event), not the reusable workflow it invokes
**Warning signs:** Authentication errors in GitHub Actions logs despite `id-token: write` permission

### Pitfall 2: Empty NODE_AUTH_TOKEN Prevents OIDC Fallback
**What goes wrong:** Workflow attempts token authentication instead of OIDC, fails even though trusted publishing is configured
**Why it happens:** npm CLI treats empty string as a value and doesn't fall back to OIDC; only completely unset variables trigger OIDC
**How to avoid:** When using trusted publishing, completely omit NODE_AUTH_TOKEN from env block (don't set to empty string or ${{ secrets.NPM_TOKEN }} if secret doesn't exist)
**Warning signs:** Authentication failures despite correct trusted publisher setup

### Pitfall 3: Publishing Scoped Packages Without --access public
**What goes wrong:** npm publish fails with 402 Payment Required for free accounts
**Why it happens:** Scoped packages (@org/package) default to private, which requires paid npm account
**How to avoid:** Always include `--access public` flag when publishing scoped packages on free account
**Warning signs:** 402 error during publish despite successful authentication
**Note:** Package "screenie" is unscoped, so this doesn't apply to current project

### Pitfall 4: File Inclusion Confusion (.npmignore vs files vs .gitignore)
**What goes wrong:** Source files, test files, or secrets accidentally published to npm
**Why it happens:** If .npmignore exists, it OVERRIDES .gitignore entirely; files whitelist is safer but can be forgotten
**How to avoid:**
- Use `files` array in package.json as whitelist (current project correctly uses `["dist"]`)
- Never use .npmignore
- Run `npm pack --dry-run` to preview what will be published
**Warning signs:** Large package size, unexpected files in tarball preview

### Pitfall 5: Unpublish Time Window
**What goes wrong:** Can't unpublish package after 24 hours even if secrets were leaked
**Why it happens:** npm prevents unpublishing after 24h to avoid breaking downstream users
**How to avoid:**
- Use prepublishOnly script to run final checks
- Test with `npm publish --dry-run` first
- If secrets published, consider them permanently compromised
**Warning signs:** Need to unpublish but past 24h window

### Pitfall 6: Missing Shebang for Binary Execution
**What goes wrong:** npx screenie fails with "command not found" even though package installed
**Why it happens:** bin file (dist/cli.js) must have executable shebang line for npx to work
**How to avoid:** Ensure dist/cli.js starts with `#!/usr/bin/env node` (current project already has this)
**Warning signs:** Package installs but npx execution fails
**Verification:** Check first line of dist/cli.js is exactly `#!/usr/bin/env node`

### Pitfall 7: npm CLI Version Too Old
**What goes wrong:** Trusted publishing not available, provenance verification fails
**Why it happens:** Trusted publishing requires npm 11.5.1+, provenance verification requires 9.5.0+
**How to avoid:** Check npm version in CI workflow, upgrade if needed: `npm install -g npm@latest`
**Warning signs:** OIDC authentication not working despite correct config

## Code Examples

Verified patterns from official sources:

### Complete GitHub Actions Workflow with Trusted Publishing
```yaml
# Source: https://docs.npmjs.com/trusted-publishers/ and https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages
name: Publish to npm

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Publish to npm
        run: npm publish --access public
        # Note: No NODE_AUTH_TOKEN - OIDC handles auth
        # Note: No --provenance flag - automatic with trusted publishing
```

### Alternative: Using Granular Access Token (Legacy 2026 Approach)
```yaml
# Source: https://www.thecandidstartup.org/2024/06/24/bootstrapping-npm-provenance-github-actions.html
name: Publish to npm

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci

      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          # Note: With tokens, must explicitly set --provenance flag
          # Token must be granular access token (classic tokens deprecated Dec 2025)
```

### Testing Package Before Publish
```bash
# Source: https://docs.npmjs.com/cli/v10/commands/npm-publish
# Preview what will be published
npm pack --dry-run

# See exact file list
npm publish --dry-run

# Test package locally
npm pack
npm install -g ./screenie-1.0.0.tgz
screenie --help
npm uninstall -g screenie
```

### Verifying Provenance After Publish
```bash
# Source: https://docs.npmjs.com/cli/v10/commands/npm-audit
# Install latest npm (requires 9.5.0+ for signature verification)
npm install -g npm@latest

# Install package
npm install screenie

# Verify provenance attestations
npm audit signatures

# Check specific package info
npm info screenie
```

### Optimal package.json for npm Publishing
```json
// Source: https://docs.npmjs.com/cli/v7/configuring-npm/package-json/
{
  "name": "screenie",
  "version": "1.0.0",
  "description": "CLI tool for capturing responsive design screenshots using Playwright",
  "keywords": [
    "screenie",
    "responsive",
    "screenshot",
    "playwright",
    "cli",
    "design",
    "testing"
  ],
  "bin": {
    "screenie": "./dist/cli.js"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "prepublishOnly": "npm run build && npm run test"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/memehalis/screenie.git"
  },
  "bugs": {
    "url": "https://github.com/memehalis/screenie/issues"
  },
  "homepage": "https://screenie.xyz",
  "author": "memehalis",
  "license": "MIT",
  "engines": {
    "node": ">=20"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Classic npm tokens | Granular access tokens with 90-day max lifetime | Dec 2025 | All classic tokens revoked; granular tokens require 2FA by default |
| Granular tokens | Trusted publishing via OIDC | Jul 2025 (GA) | Eliminates token management, automatic provenance, zero security rotation overhead |
| Manual --provenance flag | Automatic provenance with trusted publishing | Jul 2025 | Simplified workflow, provenance enabled by default |
| PGP signatures | ECDSA signatures via Sigstore | 2023-2026 transition | Compact signatures, no extra CLI dependencies, public transparency log |
| .npmignore files | `files` whitelist in package.json | Long-standing best practice, emphasized 2024+ | Prevents secret leakage (especially after supply chain attacks) |
| publish-on-push workflows | publish-on-release workflows | 2024+ best practice | Separates deployment from development, allows pre-publish review |

**Deprecated/outdated:**
- **Classic npm tokens:** Permanently deprecated Dec 9, 2025, all existing tokens revoked
- **npm < 11.5.1 for trusted publishing:** Trusted publishing requires 11.5.1+ (released mid-2025)
- **npm < 9.5.0 for provenance verification:** `npm audit signatures` requires 9.5.0+
- **Using .npmignore:** Replaced by `files` whitelist for security (prevents secret leakage)

## Open Questions

Things that couldn't be fully resolved:

1. **Playwright Chromium Auto-Install on npx First Run**
   - What we know: package.json has `"postinstall": "playwright install chromium"` which runs after npm install
   - What's unclear: Whether postinstall runs on npx first-time execution (npx downloads to temp cache)
   - Recommendation: Success criteria requires "npx screenie --help works without prior installation" - verify this works in Phase 16 execution; may need to handle Chromium installation differently for npx users or document first-run behavior

2. **npm Trusted Publisher Environment Field**
   - What we know: Trusted publisher config on npmjs.com has optional "environment name" field for GitHub Actions environments
   - What's unclear: Whether to use GitHub environments for publish workflow or leave empty
   - Recommendation: Start with empty environment field (simpler); add environment later if need approval gates or environment-specific secrets

3. **Package Discoverability Timeline**
   - What we know: npm search indexes keywords and description fields, npms.io ranks by quality/popularity/maintenance
   - What's unclear: How long after publish does package appear in npm search results
   - Recommendation: Success criterion "npm info screenie returns metadata" is immediate and verifiable; search indexing may lag but is not critical path

## Sources

### Primary (HIGH confidence)
- [npm Trusted Publishing Docs](https://docs.npmjs.com/trusted-publishers/) - Official npm documentation on OIDC setup
- [npm Generating Provenance Statements](https://docs.npmjs.com/generating-provenance-statements/) - Official provenance implementation guide
- [GitHub Changelog: npm Trusted Publishing GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) - Official GA announcement
- [npm package.json Docs](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/) - Official package.json specification
- [npm audit signatures](https://docs.npmjs.com/cli/v10/commands/npm-audit/) - Official verification command docs
- [npm Viewing Package Provenance](https://docs.npmjs.com/viewing-package-provenance/) - How to verify provenance on npmjs.com
- [GitHub Actions Publishing Node.js Packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) - Official GitHub docs

### Secondary (MEDIUM confidence)
- [The Candid Startup: Bootstrapping NPM Provenance](https://www.thecandidstartup.org/2024/06/24/bootstrapping-npm-provenance-github-actions.html) - Detailed implementation guide with workflow examples
- [GitHub Blog: Introducing npm Package Provenance](https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/) - Technical deep dive on Sigstore/SLSA integration
- [remarkablemark: How to Set Up Trusted Publishing](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/) - Step-by-step setup guide
- [HeyNode: Semantic Versioning Guide](https://heynode.com/tutorial/how-use-semantic-versioning-npm/) - Best practices for version management
- [Zell Liew: Ignoring Files from npm Package](https://zellwk.com/blog/ignoring-files-from-npm-package/) - Files field vs .npmignore comparison

### Tertiary (LOW confidence)
- [WebSearch 2026: npm security shifts](https://thehackernews.com/2025/09/github-mandates-2fa-and-short-lived.html) - News article on token deprecation, unverified timeline details
- [WebSearch: npm package discovery optimization](https://www.oreateai.com/blog/comprehensive-guide-to-npm-package-development-and-optimization/01e45b5083d756744f4bb393713e9ad6) - Blog post on npms.io ranking, not official source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified from official npm and GitHub docs; trusted publishing is documented standard as of 2026
- Architecture: HIGH - Workflow patterns from official GitHub/npm documentation; package.json structure from npm spec
- Pitfalls: HIGH - Verified from official docs, GitHub issues, and trusted community sources; common issues well-documented

**Research date:** 2026-01-20
**Valid until:** 2026-04-20 (90 days - npm ecosystem moving fast with security changes, trusted publishing is new GA feature)

**Current project status:**
- package.json: Well-configured (name, files whitelist, bin, keywords, description, MIT license, repository, homepage)
- dist/cli.js: Has correct shebang `#!/usr/bin/env node`
- prepublishOnly script: Already configured (`npm run build && npm run test`)
- GitHub Actions workflow: NOT YET CREATED (no .github/workflows/ directory in project root)
- npm account/trusted publisher: Unknown status (verify during phase execution)

**Critical next steps for planning:**
1. Create .github/workflows/publish.yml with release trigger
2. Configure trusted publisher on npmjs.com (organization: memehalis, repository: screenie, workflow: publish.yml)
3. Test with dry-run before actual publish
4. Verify all success criteria after first publish
