# Scripts

This directory contains utility scripts for the Grottocenter project.

## translations/update-en.js

This script scans all JSX files in the project to find translation keys and automatically adds missing ones to the English translation file (`packages/web-app/public/lang/en.json`).

### Features

- Scans all JSX files for translation keys using multiple patterns:
  - `<Translate>key</Translate>` components
  - `formatMessage({ id: 'key' })` calls
  - `intl.formatMessage({ id: 'key' })` calls
- Preserves the existing order of translations in en.json
- Only adds missing keys (no duplicates)
- Uses the key itself as the default translation value

### Usage

```bash
# Run the script
yarn translations:update-en

# Or run directly with Node.js
node scripts/translations/update-en.js
```

### Output

The script will:
1. Scan all JSX files and extract translation keys
2. Compare with existing translations in en.json
3. Add any missing keys to the end of the file
4. Report the number of keys found and added

### Example Output

```
Starting translation keys update...

Scanning JSX files for translation keys...
Found 5 keys in packages/web-app/src/pages/Dashboard.jsx
...
Total unique translation keys found: 611

Loading existing translations...
Existing translations count: 1621

Updating translations...
Found 136 missing translation keys:
  - "New Key 1"
  - "New Key 2"
  ...

Successfully updated packages/web-app/public/lang/en.json with 136 new translation keys

✅ Translation update completed successfully!
```

## translations/sync-with-en.js

Compares a translation file with en.json to check synchronization.

### Usage

```bash
# Compare a translation file with en.json
yarn translations:sync-with-en <target-file>

# Or run directly with Node.js
node scripts/translations/sync-with-en.js <target-file>
```

### Features

- Compares key counts between files
- Lists missing keys in each file
- Shows the values for missing keys
- Returns appropriate exit codes for CI/CD integration
- Handles file errors gracefully

### Example Output

```
Comparing target file with 'en.json'
Keys in en.json: 1758
Keys in target file: 1750

Keys missing in target file (8):
  "New Feature": "New Feature"
  "Another Key": "Another Key"
  ...

❌ Files are not synchronized - 8 missing keys total.
```

## translations/sort.js

Sorts translation file keys alphabetically (case-insensitive) to maintain consistent ordering across translation files.

### Usage

```bash
# Sort a translation file
yarn translations:sort <path-to-json-file>

# Or run directly with Node.js
node scripts/translations/sort.js <path-to-json-file>
```

### Features

- Sorts keys alphabetically with case-insensitive comparison
- Preserves original values for each key
- Maintains proper JSON formatting with 2-space indentation
- Overwrites the original file with sorted content
- Provides clear success/error messages

### Example Output

```
Translation file packages/web-app/public/lang/en.json sorted successfully!
```

### Use Cases

- Organizing translation files for better maintainability
- Preparing files for easier diff comparisons
- Standardizing key order across different language files
- Cleaning up translation files after bulk additions