#!/usr/bin/env node

/**
 * Verifies that specified keys are not left untranslated in non-English files.
 * A value is considered "untranslated" if it exactly matches the English value
 * AND is not a known technical term / acronym.
 *
 * Usage:
 *   node scripts/translations/verify-translations.js '{"key1":"English val1","key2":"English val2"}'
 *
 * Output (JSON):
 *   {
 *     "ok": false,
 *     "failures": [
 *       { "file": "fr.json", "key": "Save", "value": "Save" },
 *       ...
 *     ]
 *   }
 *
 * Exit code 0 if all good, exit code 1 if failures found.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const LANG_DIR = path.resolve(__dirname, '../../packages/web-app/public/lang');

const input = process.argv[2];
if (!input) {
  console.error(
    'Usage: node verify-translations.js \'{"key":"English value",...}\''
  );
  process.exit(1);
}

let keys;
try {
  keys = JSON.parse(input);
} catch (e) {
  console.error(`Invalid JSON input: ${e.message}`);
  process.exit(1);
}

// Heuristic: value is likely a technical term if it's all uppercase, a URL,
// a single word that matches common tech terms, or contains no letters.
const TECHNICAL_PATTERN = /^[A-Z0-9_./-]+$|^https?:\/\/|^[^a-zA-Z]*$/;

function isTechnicalTerm(value) {
  if (TECHNICAL_PATTERN.test(value)) return true;
  // Single short word (<=4 chars) all caps — likely acronym
  if (value.length <= 4 && value === value.toUpperCase()) return true;
  return false;
}

const langFiles = glob.sync(`${LANG_DIR}/*.json`).filter(f => {
  const base = path.basename(f);
  return base !== 'en.json' && base !== '_README.md';
});

const failures = [];

for (const filePath of langFiles) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const data = JSON.parse(raw);
  const fileName = path.basename(filePath);

  for (const [key, enValue] of Object.entries(keys)) {
    if (!(key in data)) {
      failures.push({ file: fileName, key, value: '(MISSING)' });
    } else if (data[key] === enValue && !isTechnicalTerm(enValue)) {
      failures.push({ file: fileName, key, value: data[key] });
    }
  }
}

const result = { ok: failures.length === 0, failures };
console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exit(1);
}
