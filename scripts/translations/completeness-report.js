#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const LANG_DIR = 'packages/web-app/public/lang';
const load = f => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));
const enData = load(path.join(LANG_DIR, 'en.json'));
const enKeys = new Set(Object.keys(enData));

const files = glob.sync(`${LANG_DIR}/*.json`);
const rows = [];

files.forEach(f => {
  const lang = path.basename(f, '.json');
  const data = load(f);
  const keys = Object.keys(data);
  const missing = [...enKeys].filter(k => !(k in data));
  const extra = keys.filter(k => !enKeys.has(k));
  const pct = (((keys.length - extra.length) / enKeys.size) * 100).toFixed(1);
  rows.push({
    lang,
    total: keys.length,
    missing: missing.length,
    extra: extra.length,
    pct
  });
});

rows.sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct));

console.log('Language  | Keys   | Missing | Extra | Coverage');
console.log('----------|--------|---------|-------|---------');
rows.forEach(r => {
  console.log(
    `${r.lang.padEnd(9)} | ${String(r.total).padStart(6)} | ${String(r.missing).padStart(7)} | ${String(r.extra).padStart(5)} | ${r.pct}%`
  );
});
