# grottocenter-front

Manage Grottocenter front packages and main app

This project use:
- [Yarn 2 'Berry'](https://github.com/yarnpkg/berry) & [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)
  
- [Lerna](https://github.com/lerna/lerna)



### List of all available packages:
- [**web-app**](/packages/web-app/README.md)

  Main web app
    
- **configurations**
  
  Shared quality and formatting rules
  
  - [eslint-config](/packages/eslint-config/README.md)
  - [eslint-config-typescript](/external/eslint-config/README.md)
  - [ts-config](/external/ts-config/README.md)
    
- [**Storybook**](/packages/storybook/README.md)

## Getting Started

- Use node v16
- Install [Yarn](https://yarnpkg.com/getting-started/install)
- `yarn` at the top-level of the repo, it will automatically install all dependencies and link local packages

## Scripts
- `start:app` start main Grottocenter app **using the production api**
- `storybook` start storybook
- `test`: run unit `test` commands on all packages
- `build`: builds all packages with `build` script

## CI

Github Actions is running 2 tasks on push and pull requests on `develop` :
 - Lint
 - Azure Static Web Apps deploy

## Release and publish

### WIP

## Production deployment (Azure)

[Full wiki article](https://github.com/GrottoCenter/grottocenter-front/wiki/Production-deployment-(Azure))

## Project organization

### Git-rules

#### Hooks

To prevent a bad commit, we use the Git hooks [husky](https://github.com/typicode/husky)

#### Commit type

[Commitlint rules](https://www.conventionalcommits.org/en/v1.0.0/) define in [commitlint config](commitlint.config.js)


## Specific dependencies or fixed version, known errors
Some dependencies are not updated or needed due to incompatibility or issues.

Added dependencies:
  
  *Used on `web-app` package*
- `eslint-config-react-app`
  Related to `yarn 2`: [issue](https://github.com/facebook/create-react-app/issues/10463)
  

Current problem:

error related bad dependencies:
https://yarnpkg.com/getting-started/migration
.yarnrc.yml
