# Grottocenter-front

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v2/monitor/29ko2.svg)](https://wikicaves.betteruptime.com)

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
- `test` Run unit tests (single run, no watch mode). Filter by pattern: `yarn test -- --testPathPattern=<pattern>`
- `storybook` Start storybook
- `translations:sync-with-en` Compares a translation file with en.json to check synchronization (use: `yarn translations:sync-with-en <target-file>`)
- `translations:update-en` Scans JSX files for translation keys and adds missing ones to `packages/web-app/public/lang/en.json` (automatically sorts the file afterwards)
- `translations:sort` Sorts translation file keys alphabetically (case-insensitive): `node scripts/translations/sort.js <path-to-json-file>`

## CI

Github Actions is running 2 tasks on push and pull requests on `develop` :

- Lint
- Azure Static Web Apps deploy

## Release and publish

### WIP

## Android app (Google Play, TWA)

GrottoCenter is packaged for the Google Play Store as a **Trusted Web Activity**
that wraps the deployed PWA. See **[`twa/README.md`](twa/README.md)** for the full
guide: PWA/service-worker setup, keystore generation, Play App Signing,
`assetlinks.json`, the CI build workflow, and secret sharing.

## Production deployment (Azure)

[Full wiki article](https://github.com/GrottoCenter/grottocenter-front/wiki/Production-deployment-(Azure))

## 🤖 AI Agents

This project is set up for use with [Claude Code](https://claude.ai/code) and compatible AI agents.

### Documentation

- **[`AGENTS.md`](AGENTS.md)** — project conventions, architecture, vocabulary, git workflow, and agent checklist. Read by agents for any work in this repo.
- **[`packages/web-app/AGENTS.md`](packages/web-app/AGENTS.md)** — web-app specifics: i18n workflow, Redux patterns, testing, env vars, UI/UX patterns. Read when working inside `packages/web-app/`.
- **[`CONTRIBUTING.md`](CONTRIBUTING.md)** — human-oriented setup guide (IDE, browser extensions, Transifex).

These files can and should be updated when conventions change, new patterns are established, or the tech stack evolves.

### Skills

Reusable agent workflows are defined in [`.agents/skills/`](.agents/skills/):

| Skill | Invocation | Description |
| ----- | ---------- | ----------- |
| `code-review` | `/code-review <PR-number>` | Fetches the diff, reads project conventions, and submits a structured review to GitHub |
| `github-workflow` | `/github-workflow` | Guides through the GrottoCenter commit/branch/PR conventions |

### Syncing skills to Claude Code

Claude Code loads skills from `.claude/skills/`. A project hook automatically mirrors any file saved under `.agents/skills/` into `.claude/skills/` so both stay in sync.

To sync manually (e.g. after cloning or pulling new skills):

```bash
# bash/zsh
cp -r .agents/skills/. .claude/skills/

# PowerShell
Copy-Item -Recurse -Force .agents\skills\* .claude\skills\
```

### Adding or modifying a skill

1. Create or edit the `SKILL.md` in `.agents/skills/<skill-name>/`.
2. The hook copies it to `.claude/skills/` automatically on the next agent write. If working outside Claude Code, run the manual sync above.
3. Invoke with `/<skill-name>` in Claude Code.

---

## Project organization

### Git-rules

#### Hooks

To prevent a bad commit, we use the Git hooks [husky](https://github.com/typicode/husky)

#### Commit type

[Commitlint rules](https://www.conventionalcommits.org/en/v1.0.0/) define in [commitlint config](commitlint.config.js)
