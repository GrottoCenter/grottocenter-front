#!/usr/bin/env node

/**
 * Checks which keys from a provided JSON already exist in en.json.
 *
 * Usage:
 *   node scripts/translations/check-existing-keys.js '{"key1":"val1","key2":"val2"}'
 *
 * Output (JSON):
 *   {
 *     "newKeys": { "key1": "val1" },
 *     "existingSameValue": ["key2"],
 *     "existingDifferentValue": { "key3": "old value" }
 *   }
 *
 * - newKeys: keys not present in en.json (safe to add)
 * - existingSameValue: keys already in en.json with the same value (skip)
 * - existingDifferentValue: keys in en.json with a different value (update)
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.resolve(
  __dirname,
  '../../packages/web-app/public/lang/en.json'
);

const input = process.argv[2];
if (!input) {
  console.error('Usage: node check-existing-keys.js \'{"key":"value",...}\'');
  process.exit(1);
}

let keys;
try {
  keys = JSON.parse(input);
} catch (e) {
  console.error(`Invalid JSON input: ${e.message}`);
  process.exit(1);
}

const raw = fs.readFileSync(EN_PATH, 'utf8').replace(/^\uFEFF/, '');
const en = JSON.parse(raw);

const result = {
  newKeys: {},
  existingSameValue: [],
  existingDifferentValue: {}
};

for (const [key, value] of Object.entries(keys)) {
  if (!(key in en)) {
    result.newKeys[key] = value;
  } else if (en[key] === value) {
    result.existingSameValue.push(key);
  } else {
    result.existingDifferentValue[key] = en[key];
  }
}

console.log(JSON.stringify(result, null, 2));
