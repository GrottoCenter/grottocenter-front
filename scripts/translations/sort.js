#!/usr/bin/env node

const fs = require('fs');

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node sort_translations.js <path-to-json-file>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read the JSON file
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Sort the keys alphabetically (case insensitive)
const sortedKeys = Object.keys(data).sort((a, b) =>
  a.toLowerCase().localeCompare(b.toLowerCase())
);

// Create new sorted object
const sortedData = {};
sortedKeys.forEach(key => {
  sortedData[key] = data[key];
});

// Write back to file with proper formatting
fs.writeFileSync(filePath, `${JSON.stringify(sortedData, null, 2)}\n`);

console.log(`Translation file ${filePath} sorted successfully!`);
