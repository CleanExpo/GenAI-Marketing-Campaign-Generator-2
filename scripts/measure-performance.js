#!/usr/bin/env node

/**
 * Performance Measurement Script
 * Measures bundle size improvements and build performance
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPercentage(before, after) {
  const diff = ((after - before) / before) * 100;
  const sign = diff > 0 ? '+' : '';
  const color = diff > 0 ? 'red' : 'green';
  return colorize(`${sign}${diff.toFixed(1)}%`, color);
}

function measureBuildTime() {
  console.log(colorize('\n📊 Measuring build performance...', 'cyan'));

  const startTime = Date.now();

  try {
    // Clean previous build
    execSync('rm -rf dist', { cwd: projectRoot, stdio: 'pipe' });

    // Build the project
    execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });

    const buildTime = Date.now() - startTime;
    console.log(colorize(`✅ Build completed in ${buildTime}ms`, 'green'));

    return buildTime;
  } catch (error) {
    console.error(colorize('❌ Build failed:', 'red'), error.message);
    process.exit(1);
  }
}

function analyzeBundleSize() {
  console.log(colorize('\n📦 Analyzing bundle size...', 'cyan'));

  const distPath = join(projectRoot, 'dist');
  if (!existsSync(distPath)) {
    console.error(colorize('❌ Dist directory not found. Run build first.', 'red'));
    return null;
  }

  try {
    // Get all JS files in dist
    const jsFiles = execSync('find dist -name "*.js" -type f', { cwd: projectRoot, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    let totalSize = 0;
    const fileDetails = [];

    for (const file of jsFiles) {
      const filePath = join(projectRoot, file);
      const stats = execSync(`stat -f%z "${filePath}" 2>/dev/null || stat -c%s "${filePath}"`, { encoding: 'utf8' });
      const size = parseInt(stats.trim());
      totalSize += size;

      fileDetails.push({
        name: file.replace('dist/', ''),
        size,
        sizeFormatted: formatBytes(size)
      });
    }

    // Sort by size (largest first)
    fileDetails.sort((a, b) => b.size - a.size);

    console.log(colorize('\n📋 Bundle Analysis:', 'bright'));
    console.log(colorize(`Total bundle size: ${formatBytes(totalSize)}`, 'bright'));
    console.log('\nLargest chunks:');

    fileDetails.slice(0, 10).forEach((file, index) => {
      const percentage = ((file.size / totalSize) * 100).toFixed(1);
      console.log(`  ${index + 1}. ${file.name} - ${file.sizeFormatted} (${percentage}%)`);
    });

    return {
      totalSize,
      fileCount: fileDetails.length,
      files: fileDetails
    };
  } catch (error) {
    console.error(colorize('❌ Failed to analyze bundle:', 'red'), error.message);
    return null;
  }
}

function checkGzipSizes() {
  console.log(colorize('\n🗜️  Analyzing gzipped sizes...', 'cyan'));

  try {
    const jsFiles = execSync('find dist -name "*.js" -type f', { cwd: projectRoot, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    let totalGzipped = 0;
    const gzipDetails = [];

    for (const file of jsFiles) {
      const filePath = join(projectRoot, file);
      const gzippedSize = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' });
      const size = parseInt(gzippedSize.trim());
      totalGzipped += size;

      gzipDetails.push({
        name: file.replace('dist/', ''),
        gzippedSize: size,
        gzippedFormatted: formatBytes(size)
      });
    }

    console.log(colorize(`Total gzipped size: ${formatBytes(totalGzipped)}`, 'bright'));

    return { totalGzipped, files: gzipDetails };
  } catch (error) {
    console.warn(colorize('⚠️  Could not measure gzipped sizes:', 'yellow'), error.message);
    return null;
  }
}

function generatePerformanceReport(buildTime, bundleAnalysis, gzipAnalysis) {
  console.log(colorize('\n📊 Performance Report', 'bright'));
  console.log('='.repeat(50));

  // Build performance
  console.log(colorize('\n🚀 Build Performance:', 'cyan'));
  console.log(`  Build time: ${buildTime}ms`);

  // Bundle size analysis
  if (bundleAnalysis) {
    console.log(colorize('\n📦 Bundle Analysis:', 'cyan'));
    console.log(`  Total size: ${formatBytes(bundleAnalysis.totalSize)}`);
    console.log(`  Number of chunks: ${bundleAnalysis.fileCount}`);

    if (gzipAnalysis) {
      console.log(`  Gzipped size: ${formatBytes(gzipAnalysis.totalGzipped)}`);
      const compressionRatio = ((bundleAnalysis.totalSize - gzipAnalysis.totalGzipped) / bundleAnalysis.totalSize * 100).toFixed(1);
      console.log(`  Compression ratio: ${compressionRatio}%`);
    }
  }

  // Performance targets
  console.log(colorize('\n🎯 Performance Targets:', 'cyan'));
  const targets = {
    'Total bundle size': { target: 600000, current: bundleAnalysis?.totalSize },
    'Main chunk size': { target: 300000, current: bundleAnalysis?.files[0]?.size },
    'Build time': { target: 30000, current: buildTime }
  };

  for (const [metric, { target, current }] of Object.entries(targets)) {
    if (current !== undefined) {
      const status = current <= target ? '✅' : '❌';
      const formatted = metric.includes('time') ? `${current}ms` : formatBytes(current);
      const targetFormatted = metric.includes('time') ? `${target}ms` : formatBytes(target);
      console.log(`  ${status} ${metric}: ${formatted} (target: ${targetFormatted})`);
    }
  }

  // Recommendations
  console.log(colorize('\n💡 Recommendations:', 'yellow'));
  if (bundleAnalysis?.totalSize > 600000) {
    console.log('  • Consider further code splitting for chunks > 300KB');
  }
  if (buildTime > 30000) {
    console.log('  • Build time is high, consider optimizing dependencies');
  }
  if (bundleAnalysis?.files.some(f => f.size > 300000)) {
    console.log('  • Some chunks are large, consider lazy loading');
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    buildTime,
    bundle: bundleAnalysis,
    gzip: gzipAnalysis,
    targets
  };

  const reportPath = join(projectRoot, 'performance-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(colorize(`\n📄 Report saved to: ${reportPath}`, 'green'));
}

// Main execution
async function main() {
  console.log(colorize('🚀 ZENITH Performance Analysis', 'bright'));
  console.log(colorize('=====================================', 'bright'));

  const buildTime = measureBuildTime();
  const bundleAnalysis = analyzeBundleSize();
  const gzipAnalysis = checkGzipSizes();

  generatePerformanceReport(buildTime, bundleAnalysis, gzipAnalysis);

  console.log(colorize('\n✨ Performance analysis complete!', 'green'));
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error(colorize('❌ Unexpected error:', 'red'), error.message);
  process.exit(1);
});

// Run the analysis
main().catch((error) => {
  console.error(colorize('❌ Analysis failed:', 'red'), error.message);
  process.exit(1);
});