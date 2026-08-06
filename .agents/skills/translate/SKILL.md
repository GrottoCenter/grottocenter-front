---
name: translate
description: Sync and translate missing i18n keys across all Grottocenter frontend language files. Detects new keys from git diff or a key filter, translates via AI, injects with proper JSON handling, and sorts.
argument-hint: '[key substring to target specific keys]'
---

You are updating translations for the Grottocenter frontend. The lang files live in `packages/web-app/public/lang/`. `en.json` is the source of truth. Follow each phase in order.

---

## Phase 1 — Identify keys to translate

**If `$ARGUMENTS` is set**: filter `en.json` keys that contain the argument as a substring (case-insensitive). Read `en.json`, list matching keys and their English values.

**Otherwise**: run both commands and merge results:

```bash
git diff develop...HEAD -- packages/web-app/public/lang/en.json
git diff HEAD -- packages/web-app/public/lang/en.json
```

The first catches all keys committed on this branch since it diverged from `develop`. The second catches uncommitted changes. Parse lines beginning with `+` (not `+++`) from both outputs, deduplicate, to get the full set of added/modified keys on the branch.

If both return empty, run `yarn translations:sync-with-en --check` to surface out-of-sync keys, show them to the user and ask which ones to translate before continuing.

---

## Phase 2 — Sync all lang files

Run:

```bash
yarn translations:sync-with-en
```

This ensures every non-en lang file has the same key set as `en.json`, filling gaps with the English fallback.

---

## Phase 3 — Find untranslated values

For each non-en lang file, check which Phase 1 keys still carry the English fallback value (i.e. `lang_file[key] === en_file[key]`). Build a per-language list of keys that need translation.

If every language already has a custom value for every key, report "all translations up to date" and stop.

---

## Phase 4 — Translate

Produce translations for all (language, key) pairs identified in Phase 3. Use your language knowledge directly — do not call external APIs.

Languages present in the project: `ar`, `bg`, `ca`, `de`, `el`, `es`, `fr`, `he`, `id`, `it`, `ja`, `nl`, `pt`, `ro`.

Output the full translation map as a JSON object:

```json
{
  "fr": { "My key": "Ma clé" },
  "de": { "My key": "Mein Schlüssel" }
}
```

---

## Phase 5 — Inject translations

Write the translation map to a temporary file `_translations_inject.json` at the project root, then write and run this Node.js script:

```js
// _translations_inject.js
const fs = require('fs');
const path = require('path');

const LANG_DIR = 'packages/web-app/public/lang';
const map = JSON.parse(fs.readFileSync('_translations_inject.json', 'utf8'));

for (const [lang, keys] of Object.entries(map)) {
  const file = path.join(LANG_DIR, `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`Skipping unknown lang: ${lang}`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  Object.assign(data, keys);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Updated: ${lang}.json (${Object.keys(keys).length} keys)`);
}
```

Run it:

```bash
node _translations_inject.js
```

Then delete both temp files:

```bash
rm _translations_inject.json _translations_inject.js
```

---

## Phase 6 — Sort and report

Run:

```bash
yarn translations:sort
```

Report: how many keys were translated, in how many languages.
