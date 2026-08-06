---
name: github-workflow
description: Grottocenter GitHub conventions — conventional commits with scope, branch from upstream develop, open a PR using the project template.
argument-hint: '[issue-id]'
---

## Prerequisites

Before anything else, verify that `gh` is installed and authenticated:

```bash
gh --version
gh auth status
```

- If `gh` is **not installed**, stop and tell the user:

  > `gh` CLI is required. Install it from https://cli.github.com or via:
  >
  > - macOS: `brew install gh`
  > - Windows: `winget install --id GitHub.cli`
  > - Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

- If `gh` is **not authenticated**, stop and tell the user to run `gh auth login`.

## Language

All generated content (PR titles, PR bodies, issue comments) must be written in English.

## Commits

Format: `type(scope): description`

Types: `feat` `fix` `refactor` `test` `docs` `chore` `style` `ci`
Scope: domain area — `cave`, `entrance`, `massif`, `auth`, `search`, `deps`, …
Example: `feat(massif): add area validation`

## Branching

Branch from an updated `develop`:

```bash
git checkout develop && git pull
git checkout -b <type>/<scope>
```

Examples: `fix/entrance-decimal-validation`, `feat/cave-export`, `chore/upgrade-deps`

## Pull Request

**1. Write the body** — read `.github/pull_request_template.md`, fill it out, save to `pr_body.md`.

**2. Show and confirm** — display the title and the **actual content of `pr_body.md`** to the user and **wait for explicit approval before proceeding**. Do not push or create the PR until the user confirms. The file must already exist on disk before asking for confirmation.

**3. Push and create:**

```bash
git push origin <branch-name>
gh pr create --title "<type(scope): description>" --body-file pr_body.md --base develop --repo <repo>
```

Where `<repo>` is detected via `gh repo view --json nameWithOwner -q .nameWithOwner`.

**3. Clean up:**

```bash
# bash/zsh
rm pr_body.md
# PowerShell
Remove-Item pr_body.md
```

## Issue linking (feat/fix only)

Ask for the issue ID if not already known, then post any relevant spec or design files as comments on the issue:

```bash
gh issue comment <issue-id> --body-file <spec-or-design-file>
```

If no issue exists, post comments on the PR instead.
