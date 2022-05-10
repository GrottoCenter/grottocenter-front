# Prettier config

These are settings for [Prettier](https://prettier.io/).

## What it does

This setup formats your JavaScript code based on practices. Check the [.prettierrc.js](.prettierrc.js) file to see what is included.

## Installing

In your project folder, run:

```
npm i -D @grotto-front/prettier-config # or yarn install --dev @grotto-front/prettier-config
npx install-peerdeps or manually add -D
prettier
```

## Usage

Create / update `prettier` file with the following content:

```json
// .prettierrc.json or .prettierrc
"@grotto-front/prettier-config"
```

```js
// prettier.config.js or .prettierrc.js
module.exports = {
  ...require('@grotto-front/prettier-config')
};
```

### Extending

This configuration is not intended to be changed, but if you have a setup where modification is required, it is possible. Prettier does not offer an "extends" mechanism as you might be familiar from tools such as ESLint.

To extend a configuration you will need to use the .js file that exports an object:

```js
module.exports = {
  ...require('@grotto-front/prettier-config'),
  semi: false
};
```

---

_If you want to test new rules you can clone the project and use [npm link](https://docs.npmjs.com/cli/v6/commands/npm-link)_

_You might need to restart your IDE after config modifications_
