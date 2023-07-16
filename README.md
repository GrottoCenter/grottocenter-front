# Grottocenter-front

The web app frontend for the [GrottoCenter project](https://fr.wikicaves.org/)

This project uses [Yarn](https://yarnpkg.com/) & [Yarn workspaces](https://yarnpkg.com/features/workspaces)

> For the backend server see [GrottoCenter/grottocenter-api](https://github.com/GrottoCenter/grottocenter-api)

## Getting Started

- Install [NodeJs](https://nodejs.org) (v20 minimum) and [Yarn](https://yarnpkg.com/getting-started/install)
- Run `yarn` to install dependencies
- Run `yarn start` to launch the app

> By default the app use the production api as backend. To modify it change the `REACT_APP_API_URL` variable in the `packages\web-app\.env` file

### Packages:

- [**Main web app**](/packages/web-app/README.md)

- **Configurations**:
  - [eslint-config](/packages/eslint-config/README.md)
  - `eslint-config-typescript`
  - [`prettier-config`](/packages/prettier-config/README.md)
  - `ts-config`

## Scripts

- `start` Start Grottocenter front
- `build` Build the Grottocenter front
- `lint` Check linting rules
- `lint:fix` Same as `lint` but will also try to fix errors
- `e2e:run` Run the end to end test suite (_require a running app_)
- `e2e:open` Open the end to end test suite browser (_require a running app_)
- `storybook` Start storybook

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
