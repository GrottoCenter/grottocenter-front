# typescript config

These are settings for [tsconfig](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).

## What it does

This setup rules for your Typescript project. Check the [tsconfig](.tsconfig.json) file to see what is included.

## Installing

In your project folder, run:

```
yarn install --dev @grotto-front/ts-config 
```

## Usage

Create / update  `tsconfig.json` file like:

```tsconfig.json
{
  "extends": "@grotto-front/tsconfig",
  "include": [
    "src"
  ],
  "exclude": [
    "node_modules",
    "**/*.test.js"
  ],
  "compilerOptions": {
    "rootDir": "src",
    "baseUrl": "src"
  }
}
```

---

*If you want to test new rules you can clone the project and use [npm link](https://docs.npmjs.com/cli/v6/commands/npm-link)*

*You might need to restart your IDE after config modifications*
