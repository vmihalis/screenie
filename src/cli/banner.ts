import figlet from 'figlet';
import pc from 'picocolors';

/**
 * Generate ASCII art banner for CLI branding
 * Displays on --version and -v flags
 */
export function generateBanner(version: string): string {
  // Generate ASCII art logo using figlet
  const asciiLogo = figlet.textSync('SCREENIE', {
    font: 'Big',
    horizontalLayout: 'fitted',
    width: 80,
  });

  // Format each component
  const coloredLogo = pc.cyan(asciiLogo);
  const versionLine = pc.dim(`  v${version}`);
  const tagline = pc.dim(
    '  Capture responsive screenshots across 57 device viewports'
  );
  const quickStart = pc.dim('  Run: screenie --help');

  // Combine all parts with proper spacing
  return [coloredLogo, '', versionLine, tagline, quickStart, ''].join('\n');
}
