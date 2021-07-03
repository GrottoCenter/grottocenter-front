# ESLint config

These are settings for [ESLint](https://eslint.org/).

## What it does

This setup lints your JavaScript code based on practices. Check the [.eslintrc.js](.eslintrc.js) file to see what is included.

## Installing

In your project folder, run:

```
yarn install --dev @grotto-front/eslint-config
install required peerDep
```

It includes `react` specific rules included as dependency in [CRA](https://www.npmjs.com/package/eslint-config-react-app#usage-in-create-react-app-projects) 

## Usage

Create / update  `.eslintrc` `.eslintrc.js` file with the following content:

```json
{
  "extends": [
    "@grotto-front/eslint-config"
  ]
}
```

```js
module.exports = {
    extends: ['@grotto-front/eslint-config']
};
```

---

*If you want to test new rules you can clone the project and use [npm link](https://docs.npmjs.com/cli/v6/commands/npm-link)*

*You might need to restart your IDE after config modifications*
