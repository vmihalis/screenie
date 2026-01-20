---
phase: 1
plan: 3
wave: 2
depends_on: [01-PLAN.md]
autonomous: true
files_modified: []
---

# Plan 3: Install Dependencies and Verify Build

<objective>
Install all npm dependencies, verify TypeScript compilation succeeds, and confirm both dev and build scripts work.
</objective>

<context>
Configuration files exist from Plan 1 and skeleton files exist from Plan 2 (or will exist - this can run in parallel with Plan 2 for dependency installation). This plan focuses on the npm ecosystem setup and build verification.

Expected scripts behavior:
- `npm run dev` should execute src/cli/index.ts via tsx without build step
- `npm run build` should produce dist/cli.js via tsup

The postinstall script will automatically run `playwright install chromium` after npm install.
</context>

<tasks>
<task id="1">
Run `npm install` in the project root to install all dependencies from package.json. This will:
- Install runtime dependencies (playwright, commander, p-limit, ora, picocolors)
- Install dev dependencies (typescript, tsup, tsx, @types/node)
- Trigger postinstall script to install Chromium browser for Playwright
</task>

<task id="2">
Verify node_modules exists and contains expected packages:
- Check node_modules/playwright exists
- Check node_modules/commander exists
- Check node_modules/typescript exists
- Check node_modules/tsup exists
</task>

<task id="3">
Run `npm run build` to verify tsup compiles TypeScript successfully:
- Should produce dist/cli.js (ESM format with shebang)
- Should produce dist/cli.d.ts (type declarations)
- Exit code should be 0
</task>

<task id="4">
Run `npm run dev` to verify tsx executes TypeScript directly:
- Should run src/cli/index.ts without compilation step
- Should output something (placeholder message from CLI)
- Exit code should be 0
</task>

<task id="5">
Verify dist/cli.js starts with shebang line (#!/usr/bin/env node) for CLI execution.
</task>
</tasks>

<verification>
- [ ] `npm install` completes without errors
- [ ] node_modules directory exists with playwright, commander, typescript, tsup packages
- [ ] `npm run build` completes with exit code 0
- [ ] dist/cli.js exists after build
- [ ] dist/cli.js contains "#!/usr/bin/env node" shebang on first line
- [ ] `npm run dev` executes without TypeScript compilation errors
</verification>

<must_haves>
- `npm run dev` executes TypeScript without build step (via tsx)
- `npm run build` produces executable in dist/
- Build output is valid ESM JavaScript
- Playwright Chromium is installed (via postinstall)
</must_haves>
