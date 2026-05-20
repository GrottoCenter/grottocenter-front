#!/usr/bin/env node

const {
  extractAllTranslationKeys,
  loadExistingTranslations
} = require('./update-en');

const usedKeys = new Set(extractAllTranslationKeys());
const existingTranslations = loadExistingTranslations();
const allKeys = Object.keys(existingTranslations);

const unusedKeys = allKeys.filter(key => !usedKeys.has(key));

if (unusedKeys.length === 0) {
  console.log('✅ No unused translation keys found.');
  process.exit(0);
}

console.log(`Found ${unusedKeys.length} potentially unused keys:\n`);
unusedKeys.sort().forEach(key => console.log(`  - "${key}"`));
console.log(
  '\nNote: Some keys may be dynamically constructed at runtime. Verify before deleting.'
);
process.exit(0);
