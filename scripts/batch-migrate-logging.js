#!/usr/bin/env node

/**
 * Batch Migration Script for Structured Logging
 * 
 * This script automates the migration of console.* calls to structured logging
 * across the codebase. It processes files in batches and creates a report.
 * 
 * Usage: node scripts/batch-migrate-logging.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be changed without making changes
 *   --path       Specific path to migrate (default: api/)
 *   --batch      Number of files per batch (default: 10)
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const CONFIG = {
  dryRun: process.argv.includes('--dry-run'),
  targetPath: process.argv.includes('--path') 
    ? process.argv[process.argv.indexOf('--path') + 1]
    : 'api',
  batchSize: process.argv.includes('--batch')
    ? parseInt(process.argv[process.argv.indexOf('--batch') + 1])
    : 10,
  excludePatterns: [
    /node_modules/,
    /\.git/,
    /\.env/,
    /package-lock\.json/,
    /\.log$/,
    /\.md$/,
    /\.sql$/,
    /\.json$/
  ]
};

// Migration statistics
const stats = {
  filesProcessed: 0,
  filesMigrated: 0,
  filesSkipped: 0,
  consoleLogs: 0,
  consoleErrors: 0,
  consoleWarns: 0,
  errors: []
};

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  // Must be a .js file
  if (!filePath.endsWith('.js')) return false;
  
  // Check exclude patterns
  for (const pattern of CONFIG.excludePatterns) {
    if (pattern.test(filePath)) return false;
  }
  
  return true;
}

/**
 * Get all JS files recursively
 */
async function getJSFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    
    if (fileStat.isDirectory()) {
      // Skip excluded directories
      if (!CONFIG.excludePatterns.some(pattern => pattern.test(filePath))) {
        await getJSFiles(filePath, fileList);
      }
    } else if (shouldProcessFile(filePath)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Check if file already has logger imported
 */
function hasLoggerImport(content) {
  return /require\(['"]\.\.\/utils\/logger['"]\)/.test(content) ||
         /require\(['"]\.\.\/\.\.\/utils\/logger['"]\)/.test(content) ||
         /require\(['"]@\/utils\/logger['"]\)/.test(content);
}

/**
 * Get relative path to logger from file
 */
function getLoggerPath(filePath) {
  const depth = filePath.split(path.sep).length - 2; // -2 for api/ root
  return '../'.repeat(depth) + 'utils/logger';
}

/**
 * Add logger import to file
 */
function addLoggerImport(content, filePath) {
  if (hasLoggerImport(content)) {
    return content;
  }
  
  const loggerPath = getLoggerPath(filePath);
  const loggerImport = `const logger = require('${loggerPath}');`;
  
  // Find the last require statement
  const requireRegex = /const\s+\w+\s*=\s*require\([^)]+\);/g;
  const matches = [...content.matchAll(requireRegex)];
  
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const insertPos = lastMatch.index + lastMatch[0].length;
    return content.slice(0, insertPos) + '\n' + loggerImport + content.slice(insertPos);
  }
  
  // If no requires found, add at the top
  return loggerImport + '\n\n' + content;
}

/**
 * Migrate console.log to logger.info
 */
function migrateConsoleLogs(content) {
  let count = 0;
  
  // Match console.log with various patterns
  const patterns = [
    // console.log('message', data)
    /console\.log\(/g,
    // console.info
    /console\.info\(/g
  ];
  
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }
  
  // Replace console.log with logger.info
  content = content.replace(/console\.log\(/g, 'logger.info(');
  content = content.replace(/console\.info\(/g, 'logger.info(');
  
  stats.consoleLogs += count;
  return content;
}

/**
 * Migrate console.error to logger.error
 */
function migrateConsoleErrors(content) {
  let count = 0;
  const pattern = /console\.error\(/g;
  const matches = content.match(pattern);
  
  if (matches) {
    count = matches.length;
  }
  
  content = content.replace(pattern, 'logger.error(');
  stats.consoleErrors += count;
  
  return content;
}

/**
 * Migrate console.warn to logger.warn
 */
function migrateConsoleWarns(content) {
  let count = 0;
  const pattern = /console\.warn\(/g;
  const matches = content.match(pattern);
  
  if (matches) {
    count = matches.length;
  }
  
  content = content.replace(pattern, 'logger.warn(');
  stats.consoleWarns += count;
  
  return content;
}

/**
 * Check if file needs migration
 */
function needsMigration(content) {
  return /console\.(log|error|warn|info)\(/.test(content);
}

/**
 * Migrate a single file
 */
async function migrateFile(filePath) {
  try {
    stats.filesProcessed++;
    
    let content = await readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Check if migration is needed
    if (!needsMigration(content)) {
      stats.filesSkipped++;
      return { migrated: false, reason: 'No console calls found' };
    }
    
    // Add logger import
    content = addLoggerImport(content, filePath);
    
    // Migrate console calls
    content = migrateConsoleLogs(content);
    content = migrateConsoleErrors(content);
    content = migrateConsoleWarns(content);
    
    // Write file if not dry run
    if (!CONFIG.dryRun && content !== originalContent) {
      await writeFile(filePath, content, 'utf8');
      stats.filesMigrated++;
      return { migrated: true };
    }
    
    if (CONFIG.dryRun) {
      stats.filesMigrated++;
      return { migrated: true, dryRun: true };
    }
    
    return { migrated: false, reason: 'No changes needed' };
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    return { migrated: false, error: error.message };
  }
}

/**
 * Process files in batches
 */
async function processBatch(files, batchNumber) {
  console.log(`\n📦 Processing batch ${batchNumber} (${files.length} files)...`);
  
  const results = [];
  for (const file of files) {
    const result = await migrateFile(file);
    results.push({ file, ...result });
    
    if (result.migrated) {
      console.log(`  ✅ ${file}`);
    } else if (result.error) {
      console.log(`  ❌ ${file} - ${result.error}`);
    } else {
      console.log(`  ⏭️  ${file} - ${result.reason}`);
    }
  }
  
  return results;
}

/**
 * Generate migration report
 */
function generateReport(allResults) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 MIGRATION REPORT');
  console.log('='.repeat(80));
  console.log(`\nMode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Target Path: ${CONFIG.targetPath}`);
  console.log(`Batch Size: ${CONFIG.batchSize}`);
  console.log('\n' + '-'.repeat(80));
  console.log('STATISTICS:');
  console.log('-'.repeat(80));
  console.log(`Files Processed: ${stats.filesProcessed}`);
  console.log(`Files Migrated: ${stats.filesMigrated}`);
  console.log(`Files Skipped: ${stats.filesSkipped}`);
  console.log(`\nReplacements Made:`);
  console.log(`  console.log → logger.info: ${stats.consoleLogs}`);
  console.log(`  console.error → logger.error: ${stats.consoleErrors}`);
  console.log(`  console.warn → logger.warn: ${stats.consoleWarns}`);
  console.log(`  Total: ${stats.consoleLogs + stats.consoleErrors + stats.consoleWarns}`);
  
  if (stats.errors.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('ERRORS:');
    console.log('-'.repeat(80));
    stats.errors.forEach(({ file, error }) => {
      console.log(`  ❌ ${file}`);
      console.log(`     ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ Migration ${CONFIG.dryRun ? 'Preview' : 'Complete'}!`);
  console.log('='.repeat(80));
  
  if (CONFIG.dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Batch Logging Migration Script');
  console.log('='.repeat(80));
  console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Target: ${CONFIG.targetPath}`);
  console.log(`Batch Size: ${CONFIG.batchSize}`);
  console.log('='.repeat(80));
  
  // Get all JS files
  console.log('\n🔍 Scanning for JavaScript files...');
  const files = await getJSFiles(CONFIG.targetPath);
  console.log(`📁 Found ${files.length} JavaScript files`);
  
  if (files.length === 0) {
    console.log('❌ No files found to process');
    return;
  }
  
  // Process files in batches
  const allResults = [];
  for (let i = 0; i < files.length; i += CONFIG.batchSize) {
    const batch = files.slice(i, i + CONFIG.batchSize);
    const batchNumber = Math.floor(i / CONFIG.batchSize) + 1;
    const results = await processBatch(batch, batchNumber);
    allResults.push(...results);
    
    // Small delay between batches
    if (i + CONFIG.batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Generate report
  generateReport(allResults);
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
