#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');

const LANG_DIR = 'packages/web-app/public/lang';
const checkMode = process.argv.includes('--check');
const filePaths = process.argv.filter(a => a !== '--check').slice(2);

// Sort the keys alphabetically: case-insensitive first, then case-sensitive as tie-breaker
const sortComparator = (a, b) =>
  a.toLowerCase().localeCompare(b.toLowerCase()) || a.localeCompare(b);

function sortFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const data = JSON.parse(raw);
  const sortedKeys = Object.keys(data).sort(sortComparator);

  const sortedData = {};
  sortedKeys.forEach(key => {
    sortedData[key] = data[key];
  });

  const sortedContent = `${JSON.stringify(sortedData, null, 2)}\n`;
  const currentContent = raw;

  if (currentContent === sortedContent) {
    return true; // already sorted
  }

  if (checkMode) {
    console.error(`NOT SORTED: ${filePath}`);
    return false;
  }

  fs.writeFileSync(filePath, sortedContent);
  console.log(`Sorted: ${filePath}`);
  return true;
}

const files =
  filePaths.length > 0 ? filePaths : glob.sync(`${LANG_DIR}/*.json`);

if (files.length === 0) {
  console.error('No translation files found.');
  process.exit(1);
}

let allSorted = true;
files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.error(`File not found: ${f}`);
    allSorted = false;
    return;
  }
  if (!sortFile(f)) allSorted = false;
});

if (checkMode && !allSorted) {
  process.exit(1);
}
