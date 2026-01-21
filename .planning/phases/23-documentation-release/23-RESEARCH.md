# Phase 23: Documentation & Release - Research

**Researched:** 2026-01-22
**Domain:** Semantic versioning, changelog documentation, breaking change communication
**Confidence:** HIGH

## Summary

This phase involves updating documentation to reflect the breaking change from v2.3.0 to v3.0.0 where viewport-only capture becomes the default behavior instead of full-page capture. The standard approach follows semantic versioning (SemVer) for version bumping, Keep a Changelog format for documenting changes, and clear migration guidance for breaking changes.

The research focused on three key areas: (1) semantic versioning best practices for major version bumps, (2) changelog format standards for breaking changes with migration notes, and (3) documentation update patterns for CLI tools when default behavior changes.

**Primary recommendation:** Follow Keep a Changelog format with a dedicated "BREAKING CHANGES" section, update all user-facing documentation to reflect viewport-only as the new default with clear `--full-page` flag examples, and use `npm version major` to bump package.json to 3.0.0.

## Standard Stack

The established tools and formats for this domain:

### Core
| Tool/Standard | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| Semantic Versioning | 2.0.0 | Version numbering system | Industry standard for communicating change impact via MAJOR.MINOR.PATCH |
| Keep a Changelog | 1.0.0 | Changelog format specification | Human-readable, machine-parseable, widely adopted format |
| npm version | built-in | Automated version bumping | Official npm tool for updating package.json and creating git tags |
| Conventional Commits | 1.0.0 | Commit message format | Enables automated changelog generation and version determination |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| conventional-changelog | latest | Auto-generate changelogs | When using conventional commits throughout project |
| semantic-release | latest | Automated release workflow | For fully automated release pipelines |
| standard-version | deprecated | Version and changelog automation | Legacy projects (now archived, use semantic-release) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Keep a Changelog | Conventional Changelog | Automated but requires strict commit conventions throughout history |
| Manual version bump | semantic-release | Fully automated but more complex setup, overkill for single manual release |
| CHANGELOG.md | GitHub Releases only | Loses in-repo documentation, harder for users to find |

**Installation:**
```bash
# No additional packages needed for this phase
# Using existing package.json and npm built-in commands
```

## Architecture Patterns

### Recommended Documentation Structure
```
project-root/
├── package.json           # Version field: "3.0.0"
├── CHANGELOG.md           # New file with breaking change documentation
├── README.md              # Updated to reflect new defaults
├── docs/
│   ├── cli-reference.md   # Updated with --full-page flag docs
│   ├── getting-started.md # Updated examples showing viewport-only default
│   └── examples.md        # Updated with --full-page usage examples
└── src/cli/
    └── banner.ts          # Displays version from package.json via tsup injection
```

### Pattern 1: Semantic Versioning for Breaking Changes
**What:** Major version (X.0.0) MUST be incremented for backward incompatible API changes
**When to use:** Any change that breaks existing user workflows without modification
**Example:**
```bash
# Current: 2.3.0 (full-page is default)
# After: 3.0.0 (viewport-only is default - BREAKING)

npm version major  # Bumps to 3.0.0, creates git tag, runs prepublishOnly
```

**Source:** [Semantic Versioning 2.0.0](https://semver.org/)

### Pattern 2: Keep a Changelog Format
**What:** Human-readable changelog with version sections and change categories
**When to use:** Every release, especially major versions with breaking changes
**Example:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-01-XX

### ⚠️ BREAKING CHANGES

- **Default capture mode changed from full-page to viewport-only**
  - Screenshots now capture only the visible viewport by default
  - To restore previous full-page behavior, use the `--full-page` flag
  - Migration: Add `--full-page` to existing commands if full-page capture is required

### Added
- New `--full-page` flag to opt-in to full-page capture

### Removed
- Fold line indicators from HTML report (redundant with viewport-only default)

### Changed
- Screenshots now capture viewport-only by default (previously full-page)
- HTML report lightbox simplified (removed wrapper div)

## [2.3.0] - 2026-01-XX
...
```

**Source:** [Keep a Changelog 1.0.0](https://keepachangelog.com/en/1.0.0/)

### Pattern 3: Breaking Change Migration Notes
**What:** Clear, actionable guidance for users upgrading across breaking changes
**When to use:** Every major version bump
**Example:**
```markdown
### Migration from 2.x to 3.0

**What changed:** The default capture mode is now viewport-only instead of full-page.

**Why:** Viewport-only capture better represents what users actually see, loads faster, and produces more manageable file sizes.

**Action required:**
- If you want to continue capturing full pages, add the `--full-page` flag to your commands
- No action needed if viewport-only screenshots meet your needs

**Before (v2.x):**
```bash
screenie https://example.com  # Captured full page by default
```

**After (v3.0):**
```bash
# Viewport-only (new default)
screenie https://example.com

# Full-page (opt-in)
screenie https://example.com --full-page
```
```

**Source:** [npm CLI Changelog](https://github.com/npm/cli/blob/latest/CHANGELOG.md) - uses ⚠️ BREAKING CHANGES section

### Pattern 4: Documentation Updates for Default Behavior Changes
**What:** Update all docs to reflect new defaults, with clear flag usage for opting into old behavior
**When to use:** When changing default behavior in a CLI tool
**Key locations:**
- README.md "Quick Start" section
- CLI Reference flag documentation
- Examples showing common usage patterns
- Getting Started guide

**Example updates:**
```markdown
<!-- README.md - Before -->
Capture full-page screenshots across 57 devices

<!-- README.md - After -->
Capture viewport screenshots across 57 devices

Add `--full-page` for full-page capture
```

```markdown
<!-- cli-reference.md - New section -->
### `--full-page`

Capture the entire page height instead of just the visible viewport.

**Default:** false (viewport-only capture)

**Example:**
```bash
screenie https://example.com --full-page
```

**Use case:** When you need screenshots of content below the fold
```

**Source:** [Salesforce CLI Release Notes](https://github.com/forcedotcom/cli/blob/main/releasenotes/README.md) - real-world example of default behavior changes

### Pattern 5: Version Display in CLI Banner
**What:** ASCII banner shows version from package.json via build-time injection
**When to use:** CLI tools with `--version` flag
**Example:**
```typescript
// tsup.config.ts injects version at build time
define: {
  __PKG_VERSION__: JSON.stringify(pkg.version),
}

// cli/banner.ts uses injected version
export function generateBanner(version: string): string {
  const versionLine = pc.dim(`  v${version}`);
  // ... return formatted banner
}

// cli/index.ts displays banner
if (process.argv.includes('--version')) {
  console.log(generateBanner(__PKG_VERSION__));
  process.exit(0);
}
```

**Source:** Existing implementation in project (no changes needed for version display)

### Anti-Patterns to Avoid
- **Vague breaking change notes:** "Changed default behavior" without explaining what or how to migrate
- **Buried breaking changes:** Placing breaking changes in middle of changelog instead of top with warning symbol
- **Missing migration examples:** Documenting WHAT changed without showing HOW to adapt
- **Incomplete doc updates:** Updating README but forgetting CLI reference or examples
- **Manual version editing:** Editing package.json directly instead of using `npm version`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Changelog generation | Custom changelog parser/generator | Keep a Changelog format (manual) or conventional-changelog (auto) | Standard format, human-readable, widely recognized |
| Version bumping | Manual package.json edits | `npm version major/minor/patch` | Handles package.json, package-lock.json, git tags, runs lifecycle scripts |
| Commit message parsing | Custom git log parser | Conventional Commits spec | Industry standard, tooling support, enables automation |
| Documentation versioning | Custom version docs | VitePress plugins (@viteplus/versions) | Handles version switching, URL routing, localization |
| Breaking change warnings | Plain text warnings | ⚠️ emoji + BREAKING CHANGES header | Visual prominence, scannable, standard pattern |

**Key insight:** Documentation and release practices have well-established standards. Follow conventions to make your project familiar to contributors and users who've seen this pattern elsewhere (npm, Angular, Vue, etc.).

## Common Pitfalls

### Pitfall 1: Forgetting to Update All Documentation Files
**What goes wrong:** README updated but CLI reference still shows old defaults, or examples still demonstrate v2.x behavior
**Why it happens:** Documentation spread across multiple files, easy to miss one
**How to avoid:**
- Create checklist of all documentation locations
- Search for keywords related to old behavior (e.g., "full-page" as default)
- Review all example commands to ensure they reflect new defaults
**Warning signs:**
- Examples in docs/ directory contradict README
- CLI reference doesn't mention new `--full-page` flag
- Getting started guide shows old behavior

### Pitfall 2: Unclear Migration Path
**What goes wrong:** Users know something broke but don't know how to fix their workflows
**Why it happens:** Documentation explains what changed but not how to adapt
**How to avoid:**
- Include "Before (v2.x)" and "After (v3.0)" code examples
- Explicitly state action required (add flag, change command, etc.)
- Link to migration guide from CHANGELOG
**Warning signs:**
- Migration notes only describe the change, no examples
- No mention of `--full-page` flag in breaking change notice
- Users would need to search docs to figure out what flag to use

### Pitfall 3: Version Number Inconsistency
**What goes wrong:** package.json shows 3.0.0 but banner still shows 2.3.0, or vice versa
**Why it happens:** Multiple places to update version, manual editing causes divergence
**How to avoid:**
- Use `npm version major` which updates package.json and package-lock.json atomically
- Rely on build-time injection (tsup) to pull version from package.json
- Never hard-code version strings in source files
**Warning signs:**
- Version in banner.ts doesn't match package.json
- Build output shows old version after package.json updated

### Pitfall 4: Premature Publishing
**What goes wrong:** Package published before tests run or docs are updated
**Why it happens:** Manual workflow with steps in wrong order
**How to avoid:**
- Use `prepublishOnly` script to run tests and build before publishing
- Follow standard workflow: update docs → commit → npm version → npm publish
- Current project already has `prepublishOnly: npm run build && npm run test`
**Warning signs:**
- Published package fails tests
- Published package has incomplete documentation
- npm publish runs before npm version

### Pitfall 5: Changelog Format Inconsistency
**What goes wrong:** Each version uses different format, hard to scan for breaking changes
**Why it happens:** No format standard adopted, ad-hoc changelog entries
**How to avoid:**
- Adopt Keep a Changelog format from the start
- Use consistent section headers (Added, Changed, Deprecated, Removed, Fixed, Security)
- Always put breaking changes at top with ⚠️ symbol
**Warning signs:**
- Some versions use bullet points, others use paragraphs
- Breaking changes buried in middle of entry
- No consistent date format

## Code Examples

Verified patterns from official sources:

### Version Bumping Workflow
```bash
# Source: npm documentation
# https://docs.npmjs.com/cli/v8/commands/npm-version

# 1. Ensure all changes committed
git status

# 2. Update documentation files (README, CHANGELOG, CLI reference, etc.)
# ... make changes ...

# 3. Commit documentation updates
git add .
git commit -m "docs: update for v3.0.0 breaking change"

# 4. Bump version (creates commit + tag, runs prepublishOnly)
npm version major  # 2.3.0 -> 3.0.0

# 5. Push with tags
git push && git push --tags

# 6. Publish to npm (runs prepublishOnly hook: build + test)
npm publish
```

### CHANGELOG.md Format for Major Version
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-01-22

### ⚠️ BREAKING CHANGES

- **Default capture mode changed from full-page to viewport-only**

  Screenshots now capture only the visible viewport by default instead of the entire page. This provides faster captures, smaller file sizes, and better represents what users actually see when visiting a page.

  **Migration:** If you need full-page screenshots (previous behavior), add the `--full-page` flag to your commands:

  ```bash
  # Old behavior (v2.x - full-page by default)
  screenie https://example.com

  # New behavior (v3.0 - viewport-only by default)
  screenie https://example.com

  # Restore full-page capture (v3.0)
  screenie https://example.com --full-page
  ```

### Added

- New `--full-page` CLI flag to opt-in to full-page capture
- Improved capture performance with viewport-only default

### Removed

- Fold line indicators from HTML report (redundant with viewport-only capture)
- Report wrapper div in lightbox view (simplified HTML structure)

### Changed

- Default capture mode is now viewport-only (was full-page in v2.x)
- HTML report lightbox displays images directly without wrapper element

## [2.3.0] - 2026-01-XX

### Changed
- Previous changes...

[Unreleased]: https://github.com/vmihalis/screenie/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/vmihalis/screenie/compare/v2.3.0...v3.0.0
[2.3.0]: https://github.com/vmihalis/screenie/releases/tag/v2.3.0
```

**Source:** [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) + [npm CLI](https://github.com/npm/cli/blob/latest/CHANGELOG.md)

### README.md Updates
```markdown
<!-- Source: Project-specific, informed by CLI best practices -->

# screenie

Capture viewport screenshots across 57 device viewports with one command.

## Quick Start

```bash
npx screenie-tool https://your-site.com
```

Screenshots are saved to `./screenshots/` and an HTML report opens automatically.

## Features

- **57 Device Viewports** - Phones, tablets, and desktops from iPhone to 4K displays
- **Viewport Capture** - Fast, focused screenshots of the visible viewport
- **Full-Page Option** - Use `--full-page` flag for entire page capture
- **HTML Report** - Visual grid of all captures, opens automatically
- **Device Presets** - `--phones-only`, `--tablets-only`, `--desktops-only`

## Usage

### Basic capture (viewport-only)

```bash
screenie https://example.com
```

### Full-page capture

```bash
screenie https://example.com --full-page
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--full-page` | Capture entire page height | viewport-only |
| `--phones-only` | Only capture phone devices (24 devices) | all |
...
```

### CLI Reference Updates
```markdown
# CLI Reference

## Options

### `--full-page`

Capture the entire page height instead of just the visible viewport.

**Default:** false (viewport-only capture)

**Example:**
```bash
screenie https://example.com --full-page
```

**When to use:**
- You need screenshots of content below the fold
- Documenting entire page layouts
- Comparing full-page designs across devices

**Note:** Full-page capture may be slower on very long pages and produce larger file sizes.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual CHANGELOG editing | Keep a Changelog format | 2020 (v1.0.0 spec) | Standardized, human-readable format |
| Hand-edited version numbers | `npm version` command | npm v1.0 (2011) | Atomic updates, automatic tagging |
| Plain text release notes | Markdown with emoji warnings | ~2020 (GitHub, npm CLI) | Visual prominence for breaking changes |
| Scattered documentation | Centralized docs/ directory | Modern practice | Single source of truth, easier maintenance |
| Git tags without automation | `npm version` creates tags | npm built-in | Consistent tagging, no manual git tag commands |

**Deprecated/outdated:**
- `standard-version` package: Archived in favor of semantic-release
- `prepublish` script: Replaced by `prepublishOnly` (npm 4+) for publish-only hooks
- Inline version strings in code: Replaced by build-time injection (tsup, webpack DefinePlugin)

## Open Questions

Things that couldn't be fully resolved:

1. **Should VitePress docs include version switcher?**
   - What we know: @viteplus/versions plugin exists for versioned VitePress docs
   - What's unclear: Whether screenie needs versioned documentation or if latest-only is sufficient
   - Recommendation: Skip versioned docs for now (single version "latest"), revisit if maintaining multiple major versions simultaneously

2. **CHANGELOG location for VitePress site?**
   - What we know: Can render CHANGELOG.md in VitePress, or keep in repo root only
   - What's unclear: Best practice for CLI tool documentation sites
   - Recommendation: Keep CHANGELOG.md in repo root, optionally add link in VitePress docs sidebar

3. **Automated changelog generation?**
   - What we know: conventional-changelog can auto-generate from conventional commits
   - What's unclear: Project doesn't use strict conventional commits throughout history
   - Recommendation: Manual CHANGELOG for v3.0.0 using Keep a Changelog format, consider conventional commits for future releases

## Sources

### Primary (HIGH confidence)
- [Semantic Versioning 2.0.0](https://semver.org/) - Official SemVer specification
- [Keep a Changelog 1.0.0](https://keepachangelog.com/en/1.0.0/) - Official changelog format spec
- [npm version command](https://docs.npmjs.com/cli/v8/commands/npm-version) - Official npm documentation
- [npm scripts lifecycle](https://docs.npmjs.com/cli/v8/using-npm/scripts/) - prepublishOnly and other hooks
- [npm CLI CHANGELOG](https://github.com/npm/cli/blob/latest/CHANGELOG.md) - Real-world example of breaking change format

### Secondary (MEDIUM confidence)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) - Commit message specification
- [Salesforce CLI Release Notes](https://github.com/forcedotcom/cli/blob/main/releasenotes/README.md) - Default behavior change examples
- [Vue CLI Migration Guides](https://cli.vuejs.org/migrations/) - Breaking change documentation patterns
- Multiple web search results from 2026 about npm versioning, changelog best practices, CLI tool documentation

### Tertiary (LOW confidence)
- Community blog posts about versioning strategies (not used for critical decisions)
- FIGlet ASCII banner tutorials (informational only, implementation already exists in project)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - SemVer and Keep a Changelog are industry standards with official specs
- Architecture: HIGH - npm version workflow is well-documented official practice
- Pitfalls: MEDIUM - Based on documented best practices and common mistakes observed in ecosystem

**Research date:** 2026-01-22
**Valid until:** 2026-03-22 (60 days - documentation and versioning standards are stable)
