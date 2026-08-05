# ESLint config

These are settings for [ESLint](https://eslint.org/), in the
[flat config](https://eslint.org/docs/latest/use/configure/configuration-files)
format (ESLint 9+). Legacy `.eslintrc` files are not supported.

## What it does

Lints JavaScript and JSX on top of the Airbnb style guide, with Prettier,
React, React Hooks, import, jsx-a11y, Cypress and Storybook rules. Check
[index.mjs](index.mjs) to see what is included and why each rule deviates.

`eslint-config-airbnb` has no flat build and is no longer released, so it is
converted at load time through `FlatCompat`. Everything else is wired through
its own flat export.

## Installing

In your project folder, run:

```
yarn install --dev @grotto-front/eslint-config
```

Then install the peer dependencies listed in `package.json` — ESLint itself,
`@eslint/js`, `@eslint/eslintrc`, and the shared plugins.

## Usage

Create / update `eslint.config.mjs` with the following content:

```js
import grottoConfig from '@grotto-front/eslint-config';

export default [...grottoConfig];
```

The package also exports the `files` glob it targets, so a consuming config can
reuse it for its own blocks:

```js
import grottoConfig, { files } from '@grotto-front/eslint-config';

export default [
  ...grottoConfig,
  { files, rules: { 'no-console': 'off' } }
];
```

Flat config has no cascade: per-directory rules that used to live in nested
`.eslintrc.js` files are expressed as `files`-scoped blocks in the root config.

---

_If you want to test new rules you can clone the project and use [npm link](https://docs.npmjs.com/cli/v6/commands/npm-link)_

_You might need to restart your IDE after config modifications_
