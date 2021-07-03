# grottocenter-front

Manage Grottocenter front packages and main app

This project use:
- [Yarn 2 'Berry'](https://github.com/yarnpkg/berry) & [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)

  
- [Lerna](https://github.com/lerna/lerna)



###List of all available packages:
- [**web-app**](/packages/web-app/README.md)

  Main web app
    
- **configurations**
  
  Shared quality and formatting rules
  
  - [eslint-config](/packages/eslint-config/README.md)
  - [eslint-config-typescript](/external/eslint-config/README.md)
  - [ts-config](/external/ts-config/README.md)
    
- [**Storybook**](/packages/storybook/README.md)

## Getting Started

- Install [Yarn](https://yarnpkg.com/getting-started/install)
- `yarn` at the top-level of the repo, it will automatically install all dependencies and link local packages

## Scripts
- `start:app` start main grottocenter app
- `storybook` start storybook
- `test`: run unit `test` commands on all packages
- `build`: builds all packages with `build` script

## Release and publish

#### WIP

## Project organization

### Git-rules

#### Hooks

To prevent a bad commit, we use the Git hooks [husky](https://github.com/typicode/husky)

#### Commit type

[Commitlint rules](https://www.conventionalcommits.org/en/v1.0.0/) define in [commitlint config](commitlint.config.js)


## Specific dependencies or fixed version, known errors
Some dependencies are not updated or needed due to incompatibility or issues.

Added dependencies:

- [`@craco/craco`](https://github.com/gsoft-inc/craco) used to add babel plugins require for `react-leaflet`.
  
  It can be removed once `react-script` use webpack 5 or if `react-leaflet` is patched:
  [Issue](https://github.com/PaulLeCam/react-leaflet/issues/891#issuecomment-860152169)
  
  *Used on `web-app` package*
- `eslint-config-react-app`
  Related to `yarn 2`: [issue](https://github.com/facebook/create-react-app/issues/10463)
  

Current problem:

error related bad dependencies:
https://yarnpkg.com/getting-started/migration
.yarnrc.yml
