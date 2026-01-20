# CLI Reference

Complete reference for all `screenie` command-line options.

## Synopsis

```
screenie [options] <url> [path]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `url` | Base URL to capture (e.g., `http://localhost:3000` or `https://example.com`) | Yes |
| `path` | Page path to capture (e.g., `/about`, `/products/1`) | No (default: `/`) |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-V, --version` | Output the version number | - |
| `--pages <paths...>` | Capture multiple page paths in one command | - |
| `-c, --concurrency <number>` | Number of parallel captures (1-50) | auto |
| `-w, --wait <ms>` | Wait buffer after page load in milliseconds | 0 |
| `--phones-only` | Only capture phone devices (24 devices) | all devices |
| `--tablets-only` | Only capture tablet devices (16 devices) | all devices |
| `--desktops-only` | Only capture desktop/laptop devices (17 devices) | all devices |
| `-o, --output <dir>` | Output directory for screenshots and report | `./screenshots` |
| `--no-open` | Suppress auto-opening report in browser (useful for CI) | report opens |
| `-h, --help` | Display help for command | - |

## Option Details

### `url` (required)

The base URL of the website to capture. Must include the protocol (`http://` or `https://`).

**Examples:**
```bash
screenie http://localhost:3000
screenie https://example.com
screenie https://staging.myapp.com
```

### `path` (optional)

A single page path to capture. Combined with the base URL.

**Examples:**
```bash
screenie https://example.com /about
screenie http://localhost:3000 /products/123
```

### `--pages <paths...>`

Capture multiple pages in one command. More efficient than running screenie multiple times.

**Example:**
```bash
screenie https://example.com --pages /home /about /contact /pricing
```

### `-c, --concurrency <number>`

Control how many screenshots are captured in parallel. Higher values are faster but use more system resources.

**Range:** 1-50
**Default:** Auto-detected based on CPU cores

**Examples:**
```bash
screenie https://example.com --concurrency 5
screenie https://example.com -c 10
```

### `-w, --wait <ms>`

Add a wait buffer after page load before capturing. Useful for animations, lazy-loaded images, or dynamic content.

**Unit:** Milliseconds
**Default:** 0 (capture immediately after load)

**Examples:**
```bash
screenie https://example.com --wait 1000
screenie https://example.com -w 2500
```

### `--phones-only`

Only capture phone devices. Reduces capture time when you only need to verify mobile layouts.

**Devices included:** 24 phone devices (iPhone SE, iPhone 15, Samsung Galaxy, Pixel, etc.)

**Example:**
```bash
screenie https://example.com --phones-only
```

### `--tablets-only`

Only capture tablet devices. Useful for testing tablet-specific layouts.

**Devices included:** 16 tablet devices (iPad, iPad Pro, Surface Pro, etc.)

**Example:**
```bash
screenie https://example.com --tablets-only
```

### `--desktops-only`

Only capture desktop and laptop devices. Useful for testing desktop-specific layouts.

**Devices included:** 17 desktop devices (1280x720, 1920x1080, 4K, etc.)

**Example:**
```bash
screenie https://example.com --desktops-only
```

### `-o, --output <dir>`

Specify a custom output directory for screenshots and the HTML report.

**Default:** `./screenshots`

**Examples:**
```bash
screenie https://example.com --output ./my-screenshots
screenie https://example.com -o ./build/screenshots
```

### `--no-open`

Suppress automatic opening of the HTML report in your browser. Useful for CI/CD environments or automated testing.

**Example:**
```bash
screenie https://example.com --no-open
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - all screenshots captured |
| 1 | Error - failed to capture or invalid arguments |

## Examples

See the [Examples](/examples) page for real-world usage patterns combining these options.
