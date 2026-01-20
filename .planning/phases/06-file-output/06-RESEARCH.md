# Phase 6: File Output - Research

**Researched:** 2026-01-20
**Domain:** Node.js file system operations, filename sanitization, directory organization
**Confidence:** HIGH

## Summary

This phase implements file output functionality to save screenshot buffers to an organized folder structure. The existing codebase already has placeholder functions in `src/output/organizer.ts` with the correct signatures - they just need implementation.

The standard approach uses Node.js built-in `fs/promises` for async file operations with `mkdir` (recursive: true) for directory creation and `writeFile` for saving PNG buffers. Filename sanitization is straightforward for this use case since device names are controlled by the codebase (not user input), so a simple regex replacement suffices without external dependencies.

**Primary recommendation:** Implement file output using only Node.js built-ins (`fs/promises`, `path`). No external dependencies needed since device names are pre-defined and controlled, not arbitrary user input.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:fs/promises | Built-in | Async file operations (mkdir, writeFile) | Native to Node.js, promise-based, no deps |
| node:path | Built-in | Cross-platform path manipulation | Essential for Windows/Unix compatibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| filenamify | 7.0.1 | String to valid filename | Only if handling arbitrary user input |
| sanitize-filename | 1.6.3 | Remove invalid chars | Legacy CJS, not recommended for ESM projects |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom regex sanitization | filenamify | filenamify handles edge cases (Windows reserved names, Unicode) but adds dependency; custom regex is sufficient for controlled device names |
| fs/promises writeFile | fs.createWriteStream | Streaming is better for very large files (>100MB); PNG screenshots are typically <10MB, so writeFile is simpler and sufficient |

**Installation:**
```bash
# No additional packages needed - using Node.js built-ins only
```

## Architecture Patterns

### Recommended Project Structure
```
./screenshots/                    # Default base directory (cwd)
└── 2026-01-20-143025/           # Timestamped run folder
    ├── phones/                   # Category subdirectory
    │   ├── iphone-14-pro-393x852.png
    │   └── samsung-galaxy-s23-360x780.png
    ├── tablets/
    │   └── ipad-pro-1024x1366.png
    └── pc-laptops/
        ├── macbook-pro-16-1728x1117.png
        └── desktop-1920x1080.png
```

### Pattern 1: Directory-First Creation
**What:** Create all category directories upfront before writing any files
**When to use:** When you know the full structure ahead of time
**Example:**
```typescript
// Source: Node.js official docs
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

async function createOutputStructure(baseDir: string): Promise<void> {
  const categories = ['phones', 'tablets', 'pc-laptops'];

  // Create all directories in parallel
  await Promise.all(
    categories.map((cat) =>
      mkdir(join(baseDir, cat), { recursive: true })
    )
  );
}
```

### Pattern 2: Write-on-Demand with Directory Guarantee
**What:** Create directory only when first file for that category is written
**When to use:** When categories may be empty (user selects subset of devices)
**Example:**
```typescript
// Source: Node.js official docs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

async function writeScreenshot(
  filepath: string,
  buffer: Buffer
): Promise<void> {
  // Ensure parent directory exists
  await mkdir(dirname(filepath), { recursive: true });
  await writeFile(filepath, buffer);
}
```

### Pattern 3: Timestamp Generation (Filesystem-Safe)
**What:** Generate ISO-like timestamp without colons (which are invalid on Windows)
**When to use:** Creating timestamped output folders
**Example:**
```typescript
// Source: Based on Date.toISOString() with Windows-safe modifications
function generateTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/T/, '-')       // Replace T with hyphen
    .replace(/:/g, '')       // Remove colons (Windows-invalid)
    .replace(/\..+/, '');    // Remove milliseconds and Z
  // Result: "2026-01-20-143025"
}
```

### Anti-Patterns to Avoid
- **Synchronous file operations:** Never use mkdirSync/writeFileSync in async code paths - blocks event loop
- **String concatenation for paths:** Always use `path.join()` for cross-platform compatibility
- **Checking existence before creation:** Don't use `fs.existsSync()` then `mkdir()` - race condition; use `mkdir({ recursive: true })` which is idempotent
- **Hardcoded separators:** Never use `'/'` or `'\\'` directly; use `path.sep` or `path.join()`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-platform paths | String concatenation with `/` | `path.join()` | Windows uses backslashes; join handles both |
| Nested directory creation | Recursive mkdir implementation | `mkdir({ recursive: true })` | Built-in handles race conditions, permissions |
| Arbitrary filename sanitization | Custom regex for all edge cases | `filenamify` (if needed) | Windows reserved names (CON, PRN, etc.), Unicode, length limits |

**Key insight:** For this project, device names are defined in the codebase (`src/devices/*.ts`), not user input. A simple regex (`/[^a-z0-9]+/gi` -> `-`) is sufficient. If the CLI later accepts arbitrary device names from users, consider adding filenamify.

## Common Pitfalls

### Pitfall 1: Windows Path Separators
**What goes wrong:** Using `/` in path strings breaks on Windows
**Why it happens:** Unix uses `/`, Windows uses `\`
**How to avoid:** Always use `path.join()` or `path.resolve()`
**Warning signs:** Paths work on Mac/Linux but fail on Windows CI

### Pitfall 2: Colons in Timestamps
**What goes wrong:** `2026-01-20T14:30:25` contains `:` which is invalid in Windows filenames
**Why it happens:** ISO 8601 format uses colons for time
**How to avoid:** Remove or replace colons: `.replace(/:/g, '')`
**Warning signs:** Files save on Mac/Linux but error on Windows

### Pitfall 3: Race Condition on Directory Check
**What goes wrong:** `if (!existsSync(dir)) mkdirSync(dir)` can fail with EEXIST
**Why it happens:** Another process creates directory between check and create
**How to avoid:** Use `mkdir({ recursive: true })` which is idempotent
**Warning signs:** Intermittent failures under parallel execution

### Pitfall 4: Trailing Spaces/Periods in Filenames
**What goes wrong:** Windows silently strips trailing `.` and ` ` from filenames
**Why it happens:** Windows NTFS limitation
**How to avoid:** Trim device names; our sanitization regex handles this naturally
**Warning signs:** Filename looks different after save on Windows

### Pitfall 5: Very Long Filenames
**What goes wrong:** Path exceeds 255 chars (filename) or 260 chars (full path on Windows)
**Why it happens:** Deep nesting + long device names + dimensions
**How to avoid:** Keep base directory shallow; device names are controlled and short
**Warning signs:** ENAMETOOLONG errors on deeply nested paths

### Pitfall 6: writeFile Without Flushing
**What goes wrong:** Process exits before data fully written to disk
**Why it happens:** OS may buffer writes
**How to avoid:** Use `await writeFile(path, data, { flush: true })` in Node.js 21.1.0+, or just await the promise (flush is optional for normal usage)
**Warning signs:** Truncated files after crash or immediate exit

## Code Examples

Verified patterns from official sources:

### Generating Safe Filename from Device
```typescript
// Custom implementation - sufficient for controlled device names
function generateFilename(
  deviceName: string,
  width: number,
  height: number
): string {
  // Lowercase, replace non-alphanumeric with hyphen, collapse multiple hyphens
  const safeName = deviceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens

  return `${safeName}-${width}x${height}.png`;
}

// Examples:
// "iPhone 14 Pro" -> "iphone-14-pro-393x852.png"
// "MacBook Pro 16\"" -> "macbook-pro-16-1728x1117.png"
// "Samsung Galaxy S23 Ultra" -> "samsung-galaxy-s23-ultra-360x780.png"
```

### Creating Timestamped Output Directory
```typescript
// Source: Node.js official docs + custom timestamp formatting
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

interface OutputOptions {
  baseDir?: string;  // Default: './screenshots'
  timestamp?: string; // Override timestamp (for testing)
}

async function createOutputDirectory(
  options: OutputOptions = {}
): Promise<string> {
  const baseDir = options.baseDir ?? './screenshots';
  const timestamp = options.timestamp ?? generateTimestamp();

  const outputDir = join(baseDir, timestamp);

  // Create with all category subdirectories
  const categories = ['phones', 'tablets', 'pc-laptops'];
  await Promise.all(
    categories.map((cat) =>
      mkdir(join(outputDir, cat), { recursive: true })
    )
  );

  return outputDir;
}
```

### Writing Screenshot to Organized Location
```typescript
// Source: Node.js official docs
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DeviceCategory } from '../devices/types.js';

interface WriteOptions {
  outputDir: string;
  category: DeviceCategory;
  filename: string;
  buffer: Buffer;
}

async function writeScreenshot(options: WriteOptions): Promise<string> {
  const { outputDir, category, filename, buffer } = options;
  const filepath = join(outputDir, category, filename);

  await writeFile(filepath, buffer);

  return filepath;
}
```

### Complete Save Flow from ExecutionResult
```typescript
// Integration with existing executor output
import type { ExecutionResult } from '../engine/types.js';
import type { Device } from '../devices/types.js';

interface SaveResult {
  success: boolean;
  filepath?: string;
  error?: string;
}

async function saveScreenshot(
  result: ExecutionResult,
  device: Device,
  outputDir: string
): Promise<SaveResult> {
  if (!result.success || !result.buffer) {
    return {
      success: false,
      error: result.error ?? 'No buffer available',
    };
  }

  const filename = generateFilename(device.name, device.width, device.height);
  const filepath = join(outputDir, device.category, filename);

  try {
    await writeFile(filepath, result.buffer);
    return { success: true, filepath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| fs callbacks | fs/promises with async/await | Node.js 14+ (2020) | Cleaner code, better error handling |
| existsSync + mkdir | mkdir({ recursive: true }) | Node.js 10.12+ (2018) | Idempotent, race-condition safe |
| Manual path building | path.join() always | Always best practice | Cross-platform compatibility |
| External slugify libs | Simple regex for controlled input | N/A | Fewer dependencies when input is controlled |

**Deprecated/outdated:**
- `fs.exists()` / `fs.existsSync()` for pre-checking: Use mkdir with recursive instead
- Callback-based fs APIs: Use fs/promises for new code
- sync methods in async contexts: Always use async versions in async code

## Open Questions

Things that couldn't be fully resolved:

1. **Absolute vs Relative Output Path**
   - What we know: Requirements say `./screenshots/YYYY-MM-DD-HHmmss/` (relative)
   - What's unclear: Should CLI accept absolute paths? Should we resolve relative to cwd?
   - Recommendation: Accept both; resolve relative paths against `process.cwd()`

2. **Empty Category Directories**
   - What we know: We create phones/, tablets/, pc-laptops/ directories
   - What's unclear: If user only selects phone devices, should empty tablet/pc-laptop dirs exist?
   - Recommendation: Create all three upfront for consistency; empty dirs are harmless

3. **Overwrite Behavior**
   - What we know: Timestamped folders prevent overwrites between runs
   - What's unclear: What if same device captured twice in one run? (edge case)
   - Recommendation: This shouldn't happen with current device registry; if it does, later write wins (fs.writeFile default)

## Sources

### Primary (HIGH confidence)
- [Node.js File System Documentation](https://nodejs.org/api/fs.html) - mkdir, writeFile, access APIs
- [Node.js Working with Folders](https://nodejs.org/en/learn/manipulating-files/working-with-folders-in-nodejs) - mkdir best practices
- [Node.js File Paths](https://nodejs.org/en/learn/manipulating-files/nodejs-file-paths) - path module usage

### Secondary (MEDIUM confidence)
- [filenamify GitHub](https://github.com/sindresorhus/filenamify) - ESM-compatible filename sanitization
- [sanitize-filename GitHub](https://github.com/parshap/node-sanitize-filename) - Filename sanitization patterns
- [Cross-platform Node.js Guide](https://github.com/ehmicky/cross-platform-node-guide) - Path handling best practices

### Tertiary (LOW confidence)
- [npm Compare: filenamify vs sanitize-filename](https://npm-compare.com/filenamify,sanitize-filename) - Download/popularity comparison
- Various Stack Overflow and blog posts - General patterns (verified against official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using only Node.js built-ins, well documented
- Architecture: HIGH - Standard patterns verified against official Node.js docs
- Pitfalls: HIGH - Known Windows/cross-platform issues, documented in Node.js guides

**Research date:** 2026-01-20
**Valid until:** 90 days (Node.js fs API is stable, unlikely to change)
