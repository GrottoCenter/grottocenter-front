#!/usr/bin/env node
/**
 * Translation synchronization utility.
 * Compares a target translation file with en.json and reports missing keys.
 *
 * Usage: node sync-translations-with-en.js <target-file>
 */

const fs = require('fs');
const path = require('path');

function loadJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: File '${filePath}' not found.`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in '${filePath}': ${error.message}`);
    } else {
      console.error(`Error reading '${filePath}': ${error.message}`);
    }
    process.exit(1);
  }
  return null;
}

function syncWithEnglish(targetFile) {
  const enFile = 'packages/web-app/public/lang/en.json';

  if (!fs.existsSync(enFile)) {
    console.error(`Error: English reference file '${enFile}' not found.`);
    process.exit(1);
  }

  const enData = loadJson(enFile);
  const targetData = loadJson(targetFile);

  const enKeys = new Set(Object.keys(enData));
  const targetKeys = new Set(Object.keys(targetData));

  const missingInTarget = [...enKeys].filter(key => !targetKeys.has(key));
  const extraInTarget = [...targetKeys].filter(key => !enKeys.has(key));

  console.log(`Synchronizing '${targetFile}' with English translations`);
  console.log(`Keys in en.json: ${enKeys.size}`);
  console.log(`Keys in ${path.basename(targetFile)}: ${targetKeys.size}`);
  console.log();

  if (missingInTarget.length > 0) {
    console.log(
      `Keys missing in '${path.basename(targetFile)}' (${missingInTarget.length}):`
    );
    missingInTarget.sort().forEach(key => {
      console.log(`  "${key}": "${enData[key]}"`);
    });
    console.log();
  }

  if (extraInTarget.length > 0) {
    console.log(
      `Extra keys in '${path.basename(targetFile)}' not in en.json (${extraInTarget.length}):`
    );
    extraInTarget.sort().forEach(key => {
      console.log(`  "${key}": "${targetData[key]}"`);
    });
    console.log();
  }

  if (missingInTarget.length === 0 && extraInTarget.length === 0) {
    console.log(
      '✅ File is synchronized with en.json - no missing or extra keys found.'
    );
  } else {
    console.log(
      `❌ File is not synchronized - ${missingInTarget.length} missing, ${extraInTarget.length} extra keys.`
    );
  }

  return missingInTarget.length + extraInTarget.length === 0;
}

function main() {
  if (process.argv.length !== 3) {
    console.log('Usage: node sync-translations-with-en.js <target-file>');
    console.log(
      'Example: node sync-translations-with-en.js packages/web-app/public/lang/fr.json'
    );
    process.exit(1);
  }

  const [, , targetFile] = process.argv;

  if (!fs.existsSync(targetFile)) {
    console.error(`Error: Target file '${targetFile}' does not exist.`);
    process.exit(1);
  }

  const synchronized = syncWithEnglish(targetFile);
  process.exit(synchronized ? 0 : 1);
}

main();
