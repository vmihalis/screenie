---
phase: 1
plan: 1
wave: 1
depends_on: []
autonomous: true
files_modified:
  - package.json
  - tsconfig.json
  - tsup.config.ts
  - .gitignore
---

# Plan 1: Initialize Project Configuration Files

<objective>
Create foundational configuration files (package.json, tsconfig.json, tsup.config.ts, .gitignore) for a TypeScript Node.js CLI project with Playwright.
</objective>

<context>
This is a greenfield project. The working directory is /home/memehalis/responsiveness-mcp with only .git and .planning directories existing. We are building a CLI tool called "responsive-capture" that uses Playwright for browser automation.

Stack decisions from research:
- Node.js 20 LTS runtime
- TypeScript ^5.4 with strict mode
- tsup ^8.0 for bundling (produces ESM output)
- tsx ^4.0 for development execution
- Playwright ^1.51 for browser automation
- Commander.js ^12.0 for CLI parsing
- p-limit ^6.0 for concurrency control
- ora ^8.0 + picocolors ^1.0 for terminal output
</context>

<tasks>
<task id="1">
Create package.json with:
- name: "responsiveness-mcp"
- version: "1.0.0"
- type: "module" (ESM)
- bin: { "responsive-capture": "./dist/cli.js" }
- scripts: dev (tsx src/cli/index.ts), build (tsup), postinstall (playwright install chromium)
- dependencies: playwright ^1.51.0, commander ^12.0.0, p-limit ^6.0.0, ora ^8.0.0, picocolors ^1.0.0
- devDependencies: typescript ^5.4.0, tsup ^8.0.0, tsx ^4.0.0, @types/node ^20.0.0
- engines: { "node": ">=20" }
</task>

<task id="2">
Create tsconfig.json with:
- target: "ES2022"
- module: "NodeNext"
- moduleResolution: "NodeNext"
- strict: true
- esModuleInterop: true
- skipLibCheck: true
- outDir: "./dist"
- rootDir: "./src"
- declaration: true
- include: ["src/**/*"]
- exclude: ["node_modules", "dist"]
</task>

<task id="3">
Create tsup.config.ts with:
- entry: ["src/cli/index.ts"]
- format: ["esm"]
- dts: true
- clean: true
- target: "node20"
- shims: true
- banner: { js: "#!/usr/bin/env node" } for CLI executable
</task>

<task id="4">
Create .gitignore with standard Node.js entries:
- node_modules/
- dist/
- *.log
- .DS_Store
- screenshots/ (output directory)
</task>
</tasks>

<verification>
- [ ] package.json exists and contains correct name, type "module", bin entry, all scripts, and all dependencies
- [ ] tsconfig.json exists with strict mode enabled and NodeNext module resolution
- [ ] tsup.config.ts exists with ESM format and node20 target
- [ ] .gitignore exists with node_modules and dist entries
- [ ] All JSON files are valid (no syntax errors)
</verification>

<must_haves>
- package.json defines "responsive-capture" binary pointing to dist/cli.js
- "npm run dev" script uses tsx to run src/cli/index.ts
- "npm run build" script invokes tsup
- TypeScript configured for ESM with strict mode
- All required dependencies listed with correct versions
</must_haves>
