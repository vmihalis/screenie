# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-01-22

### BREAKING CHANGES

- **Default capture mode changed from full-page to viewport-only**

  Screenshots now capture only the visible viewport by default instead of the entire page. This provides faster captures, smaller file sizes, and better represents what users actually see when visiting a page.

  **Migration:** If you need full-page screenshots (previous behavior), add the `--full-page` flag to your commands:

  ```bash
  # v2.x behavior (full-page by default)
  screenie https://example.com

  # v3.0 equivalent (opt-in to full-page)
  screenie https://example.com --full-page
  ```

### Added

- New `--full-page` CLI flag to opt-in to full-page capture

### Removed

- Fold line indicators from HTML report (redundant with viewport-only capture)

### Changed

- Default capture mode is now viewport-only (was full-page in v2.x)
- HTML report lightbox displays images directly without wrapper element

## [2.3.0] - 2026-01-21

### Added

- ASCII art banner with version display on `--version` flag
- Terminal width detection for responsive banner sizing

## [2.2.0] - 2026-01-21

### Added

- Multi-page capture support with `--pages` flag
- Parallel page processing for faster multi-page captures

## [2.1.0] - 2026-01-21

### Added

- Device filtering with `--phones-only`, `--tablets-only`, `--desktops-only` flags
- Custom output directory with `-o, --output` flag
- Wait buffer option with `-w, --wait` flag
- Concurrency control with `-c, --concurrency` flag
- Auto-open suppression with `--no-open` flag

## [2.0.0] - 2026-01-21

### Added

- HTML report generation with visual grid of all captures
- Lightbox view for full-size screenshot inspection
- Cookie banner auto-hiding (50+ common selectors)
- 57 device viewport presets (phones, tablets, desktops)

### Changed

- Complete rewrite from MCP server to standalone CLI tool

## [1.0.0] - 2026-01-20

### Added

- Initial release as MCP server for responsive screenshot capture
- Basic screenshot capture functionality
- Playwright-based browser automation

[Unreleased]: https://github.com/vmihalis/screenie/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/vmihalis/screenie/compare/v2.3.0...v3.0.0
[2.3.0]: https://github.com/vmihalis/screenie/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/vmihalis/screenie/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/vmihalis/screenie/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/vmihalis/screenie/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/vmihalis/screenie/releases/tag/v1.0.0
