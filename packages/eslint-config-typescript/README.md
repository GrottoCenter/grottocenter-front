# ESLint config typescript

These are settings for [ESLint](https://eslint.org/).

## What it does

This setup lints your Typescripts code based on practices. Check the [.eslintrc.js](.eslintrc.js) file to see what is included.
It's used with [@grotto-front/eslint-config](../eslint-config).

## Installing

In your project folder, run:

```
yarn install --dev @grotto-front/eslint-config-typescript
npx install-peerdeps or manually add -D
@typescript-eslint/eslint-plugin
@typescript-eslint/parser
```

## Usage

Create / update `.eslintrc` `.eslintrc.js` file with the following content:

```json
{
  "extends": ["@grotto-front/eslint-config-typescript"]
}
```

```js
module.exports = {
  extends: ['@@grotto-front/eslint-config-typescript']
};
```

---

_If you want to test new rules you can clone the project and use [npm link](https://docs.npmjs.com/cli/v6/commands/npm-link)_

_You might need to restart your IDE after config modifications_
