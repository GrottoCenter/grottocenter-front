# Grottocenter Front

[![Lint](https://github.com/Grottocenter/grottocenter-front/actions/workflows/lint.yml/badge.svg?branch=develop)](https://github.com/Grottocenter/grottocenter-front/actions/workflows/lint.yml)
[![Test](https://github.com/Grottocenter/grottocenter-front/actions/workflows/test.yml/badge.svg?branch=develop)](https://github.com/Grottocenter/grottocenter-front/actions/workflows/test.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![Uptime](https://uptime.betterstack.com/status-badges/v2/monitor/29ko2.svg)](https://wikicaves.betteruptime.com)

Web app frontend for [Grottocenter](https://fr.wikicaves.org/), the Wiki database made by cavers for cavers, maintained by [Wikicaves](https://fr.wikicaves.org/).

This project uses [Yarn](https://yarnpkg.com/) & [Yarn workspaces](https://yarnpkg.com/features/workspaces).

> [!NOTE]
> For the backend server see [Grottocenter/grottocenter-api](https://github.com/Grottocenter/grottocenter-api).

## 🚀 Getting Started

- Install [Node.js](https://nodejs.org) (v20 minimum) and [Yarn](https://yarnpkg.com/getting-started/install)
- Run `yarn` to install dependencies
- Run `yarn start` to launch the app

### Configuration

By default the app uses the production API as backend. To change it, edit the `VITE_API_URL` variable in `packages/web-app/.env`.

### Packages

- [**Main web app**](/packages/web-app/README.md)
- **Configurations**:
  - [`eslint-config`](/packages/eslint-config/README.md)
  - [`prettier-config`](/packages/prettier-config/README.md)
  - `ts-config`

## Scripts

- `start` Start Grottocenter Front
- `build` Build the Grottocenter Front
- `lint` Check linting rules
- `lint:fix` Same as `lint` but will also try to fix errors
- `e2e:run` Run the end-to-end test suite (_requires a running app_)
- `e2e:open` Open the end-to-end test suite browser (_requires a running app_)
- `test` Run unit tests (single run, no watch mode). Filter by pattern: `yarn test -- --testPathPattern=<pattern>`
- `storybook` Start Storybook
- `translations:sync-with-en` Compare a translation file with `en.json` to check synchronization (usage: `yarn translations:sync-with-en <target-file>`)
- `translations:update-en` Scan JSX files for translation keys and add missing ones to `packages/web-app/public/lang/en.json` (automatically sorts the file afterwards)
- `translations:sort` Sort translation file keys alphabetically (case-insensitive): `node scripts/translations/sort.js <path-to-json-file>`

## CI

GitHub Actions runs on push and pull requests targeting `develop`:

- Lint
- Unit tests & end-to-end tests (Cypress)
- CodeQL analysis
- Translations sync
- Azure Static Web Apps deploy
- Release (tag + changelog on every merge into `develop`)

Only on `app-x.y.z` tags:

- TWA build

## 📱 Android app (Google Play, TWA)

Grottocenter is packaged for the Google Play Store as a **Trusted Web Activity**
that wraps the deployed PWA. See [`twa/README.md`](twa/README.md) for the full
guide: PWA/service-worker setup, keystore generation, Play App Signing,
`assetlinks.json`, the CI build workflow, and secret sharing.

## ☁️ Production deployment (Azure)

[Full wiki article](https://github.com/Grottocenter/grottocenter-front/wiki/Production-deployment-(Azure))

## 🤖 AI Agents

This project is set up for use with any AI agent, including [Claude Code](https://claude.ai/code).

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
| `github-workflow` | `/github-workflow` | Guides through the Grottocenter commit/branch/PR conventions |

#### Syncing skills to Claude Code

Claude Code loads skills from `.claude/skills/`. A project hook automatically mirrors any file saved under `.agents/skills/` into `.claude/skills/` so both stay in sync.

To sync manually (e.g. after cloning or pulling new skills):

```bash
# bash/zsh
cp -r .agents/skills/. .claude/skills/

# PowerShell
Copy-Item -Recurse -Force .agents\skills\* .claude\skills\
```

#### Adding or modifying a skill

1. Create or edit the `SKILL.md` in `.agents/skills/<skill-name>/`.
2. The hook copies it to `.claude/skills/` automatically on the next agent write. If working outside Claude Code, run the manual sync above.
3. Invoke with `/<skill-name>` in Claude Code.

## Project organization

### Git rules

#### Hooks

To prevent bad commits, we use [Husky](https://github.com/typicode/husky) Git hooks.

#### Commit type

[Commitlint rules](https://www.conventionalcommits.org/en/v1.0.0/) are defined in the [commitlint config](commitlint.config.js).
