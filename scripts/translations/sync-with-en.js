#!/usr/bin/env node
/**
 * Translation synchronization utility.
 * Adds missing keys (English fallback) and removes extra keys not in en.json.
 *
 * Usage:
 *   node sync-with-en.js [target-file]   — sync one file or all lang files
 *   node sync-with-en.js --check [file]  — report only, no writes
 */

const fs = require('fs');
const path = require('path');

function loadJson(filePath) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
  return data;
}

function syncWithEnglish(targetFile, checkOnly) {
  const enFile = 'packages/web-app/public/lang/en.json';

  if (!fs.existsSync(enFile)) {
    console.error(`Error: English reference file '${enFile}' not found.`);
    process.exit(1);
  }

  const enData = loadJson(enFile);
  const targetData = loadJson(targetFile);

  const enKeys = Object.keys(enData);
  const targetKeys = new Set(Object.keys(targetData));

  const missingInTarget = enKeys.filter(key => !targetKeys.has(key));
  const extraInTarget = [...targetKeys].filter(
    key => !Object.prototype.hasOwnProperty.call(enData, key)
  );

  console.log(
    `${checkOnly ? 'Checking' : 'Syncing'} '${path.basename(targetFile)}'`
  );

  if (missingInTarget.length === 0 && extraInTarget.length === 0) {
    console.log('  ✅ Already in sync.\n');
    return true;
  }

  if (missingInTarget.length > 0) {
    console.log(
      `  + ${missingInTarget.length} missing keys (will use English fallback)`
    );
    if (checkOnly)
      missingInTarget.sort().forEach(k => console.log(`      "${k}"`));
  }
  if (extraInTarget.length > 0) {
    console.log(`  - ${extraInTarget.length} extra keys (not in en.json)`);
    if (checkOnly)
      extraInTarget.sort().forEach(k => console.log(`      "${k}"`));
  }

  if (!checkOnly) {
    // Rebuild object following en.json key order, adding missing as English fallback
    const synced = {};
    for (const key of enKeys) {
      synced[key] = targetKeys.has(key) ? targetData[key] : enData[key];
    }
    fs.writeFileSync(
      targetFile,
      `${JSON.stringify(synced, null, 2)}\n`,
      'utf8'
    );
    console.log('  ✅ Done.\n');
  } else {
    console.log('  ❌ Out of sync.\n');
  }

  return false;
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const targetArg = args.find(a => !a.startsWith('--'));

  const langDir = 'packages/web-app/public/lang';

  const targets = targetArg
    ? [targetArg]
    : fs
        .readdirSync(langDir)
        .filter(f => f.endsWith('.json') && f !== 'en.json')
        .map(f => path.join(langDir, f));

  if (targetArg && !fs.existsSync(targetArg)) {
    console.error(`Error: Target file '${targetArg}' does not exist.`);
    process.exit(1);
  }

  let allSynchronized = true;
  for (const targetFile of targets) {
    const synchronized = syncWithEnglish(targetFile, checkOnly);
    if (!synchronized) allSynchronized = false;
  }

  process.exit(allSynchronized ? 0 : 1);
}

main();
