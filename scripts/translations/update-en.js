#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const { decode } = require('html-entities');

// Configuration
const JSX_FILES_PATTERN = 'packages/web-app/src/**/*.{jsx,js}';
const EN_JSON_PATH = 'packages/web-app/public/lang/en.json';

// Regular expressions to find translation keys
// Group 1 captures the opening quote; group 2 captures the key content.
// Using a backreference (\1) so we only stop at the *same* closing quote,
// allowing the other quote types to appear freely inside the key.
// Self-closing <Translate ... /> tags don't match because [^>]*> stops at the
// first > (inside />) and ([\s\S]*?)<\/Translate> then fails to find a closing tag.
const TRANSLATE_COMPONENT_REGEX = /<Translate[^>]*>([\s\S]*?)<\/Translate>/g;
const FORMAT_MESSAGE_REGEX =
  /formatMessage\(\s*\{[\s\S]*?id:\s*(['"`])((?:(?!\1)[\s\S])*)\1/g;
const INTL_FORMAT_MESSAGE_REGEX =
  /intl\.formatMessage\(\s*\{[\s\S]*?id:\s*(['"`])((?:(?!\1)[\s\S])*)\1/g;

/**
 * Validate if a key is safe for JSON and not truncated
 */
function isValidTranslationKey(key) {
  if (!key || key.length === 0) return false;
  if (key.includes('{') || key.includes('$')) return false;
  if (
    key.includes('<') ||
    key.includes('>') ||
    key.includes('(') ||
    key.includes(')')
  )
    return false;

  // Check for truncated contractions (words ending with 'n' that should be "n't")
  if (
    key.match(/\b\w+n$/) &&
    !key.match(
      /\b(an|in|on|can|man|than|when|then|been|seen|given|taken|written|spoken)$/
    )
  ) {
    return false;
  }

  // Check for other suspicious truncations
  if (
    key.match(/\b\w{1,2}$/) &&
    !key.match(
      /\b(a|an|at|be|by|do|go|he|if|in|is|it|me|my|no|of|on|or|so|to|up|us|we)$/
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Extract translation keys from JSX file content
 */
function extractKeysFromContent(content) {
  const keys = new Set();

  // Extract from <Translate> components
  let match = TRANSLATE_COMPONENT_REGEX.exec(content);
  while (match !== null) {
    let key = match[1].trim();
    // Decode HTML entities and normalize whitespace
    key = decode(key).replace(/\s+/g, ' ').trim();
    if (isValidTranslationKey(key)) {
      keys.add(key);
    }
    match = TRANSLATE_COMPONENT_REGEX.exec(content);
  }

  // Extract from formatMessage({ id: 'key' })
  match = FORMAT_MESSAGE_REGEX.exec(content);
  while (match !== null) {
    const key = match[2];
    if (isValidTranslationKey(key)) {
      keys.add(key);
    }
    match = FORMAT_MESSAGE_REGEX.exec(content);
  }

  // Extract from intl.formatMessage({ id: 'key' })
  match = INTL_FORMAT_MESSAGE_REGEX.exec(content);
  while (match !== null) {
    const key = match[2];
    if (isValidTranslationKey(key)) {
      keys.add(key);
    }
    match = INTL_FORMAT_MESSAGE_REGEX.exec(content);
  }

  // Extract from defineMessages({ key: { id: '...' } })
  for (const blockMatch of content.matchAll(
    /defineMessages\(\s*\{([\s\S]*?)\}\s*\)/g
  )) {
    for (const idMatch of blockMatch[1].matchAll(
      /id:\s*(['"`])((?:(?!\1)[\s\S])*?)\1/g
    )) {
      const key = idMatch[2];
      if (isValidTranslationKey(key)) keys.add(key);
    }
  }

  return Array.from(keys);
}

/**
 * Scan all JSX files and extract translation keys
 */
function extractAllTranslationKeys() {
  console.log('Scanning JSX files for translation keys...');

  const jsxFiles = glob.sync(JSX_FILES_PATTERN);
  const allKeys = new Set();

  jsxFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const keys = extractKeysFromContent(content);
      keys.forEach(key => allKeys.add(key));

      if (keys.length > 0) {
        console.log(`Found ${keys.length} keys in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
    }
  });

  console.log(`Total unique translation keys found: ${allKeys.size}`);
  return Array.from(allKeys).sort();
}

/**
 * Load existing translations from en.json
 */
function loadExistingTranslations() {
  try {
    const content = fs
      .readFileSync(EN_JSON_PATH, 'utf8')
      .replace(/^\uFEFF/, '');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${EN_JSON_PATH}:`, error.message);
    return {};
  }
}

/**
 * Update en.json with missing translation keys
 */
function updateTranslations(foundKeys, existingTranslations) {
  const missingKeys = foundKeys.filter(key => !(key in existingTranslations));

  // Check for potential truncated versions of existing keys.
  // Only flag if the existing key continues with a word character or space after
  // the candidate — pure punctuation suffixes (e.g. "Zone" vs "Zone:") are not truncations.
  const suspiciousKeys = missingKeys.filter(key =>
    Object.keys(existingTranslations).some(existingKey => {
      if (!existingKey.startsWith(key) || existingKey.length <= key.length)
        return false;
      const nextChar = existingKey[key.length];
      return /[\w\s]/.test(nextChar);
    })
  );

  if (suspiciousKeys.length > 0) {
    console.warn('⚠️  Suspicious keys detected (possible truncations):');
    suspiciousKeys.forEach(key => {
      const fullKey = Object.keys(existingTranslations).find(
        existingKey =>
          existingKey.startsWith(key) && existingKey.length > key.length
      );
      console.warn(`  - "${key}" (possible truncation of "${fullKey}")`);
    });
  }

  // Filter out suspicious keys
  const validMissingKeys = missingKeys.filter(
    key => !suspiciousKeys.includes(key)
  );

  if (validMissingKeys.length === 0) {
    console.log(
      'No valid missing translation keys found. All keys are already present in en.json'
    );
    return false;
  }

  console.log(`Found ${validMissingKeys.length} missing translation keys:`);
  validMissingKeys.forEach(key => console.log(`  - "${key}"`));

  // Add missing keys to existing translations
  const updatedTranslations = { ...existingTranslations };
  validMissingKeys.forEach(key => {
    updatedTranslations[key] = key;
  });

  // Write back to file with proper formatting
  try {
    const jsonContent = JSON.stringify(updatedTranslations, null, 2);
    fs.writeFileSync(EN_JSON_PATH, `${jsonContent}\n`, 'utf8');
    console.log(
      `Successfully updated ${EN_JSON_PATH} with ${validMissingKeys.length} new translation keys`
    );
    return true;
  } catch (error) {
    console.error(`Error writing to ${EN_JSON_PATH}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const checkMode = process.argv.includes('--check');
  console.log('Starting translation keys update...\n');

  // Extract all translation keys from JSX files
  const foundKeys = extractAllTranslationKeys();

  // Load existing translations
  console.log('\nLoading existing translations...');
  const existingTranslations = loadExistingTranslations();
  console.log(
    `Existing translations count: ${Object.keys(existingTranslations).length}`
  );

  const missingKeys = foundKeys.filter(key => !(key in existingTranslations));

  if (checkMode) {
    if (missingKeys.length > 0) {
      console.error(
        `\n❌ ${missingKeys.length} keys found in source but missing from en.json:`
      );
      missingKeys.forEach(key => console.error(`  - "${key}"`));
      process.exit(1);
    }
    console.log('\n✅ All source translation keys are present in en.json.');
    return;
  }

  // Update translations with missing keys
  console.log('\nUpdating translations...');
  const updated = updateTranslations(foundKeys, existingTranslations);

  if (updated) {
    console.log('\n✅ Translation update completed successfully!');
  } else {
    console.log(
      '\n✅ No updates needed - all translation keys are already present.'
    );
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  extractKeysFromContent,
  extractAllTranslationKeys,
  loadExistingTranslations,
  updateTranslations,
  isValidTranslationKey
};
