---
name: github-workflow
description: Grottocenter GitHub conventions — conventional commits with scope, branch from upstream develop, open a PR using the project template.
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

- On Windows, credentials may be hidden inside the sandbox. Run commands
  sandboxed first; if an authenticated `gh` command or Git network operation
  fails due to an auth or credential error, retry that command with escalated
  permissions before asking.
- If `gh` is still **not authenticated**, stop and tell the user to run
  `gh auth login`.
- Do not print remote URLs: `git remote -v` and
  `git config --get remote.origin.url` may expose an embedded token.
  Use `gh repo view` to identify the repository.

## Language

All generated content (PR titles, PR bodies, issue comments) must be written in English.

## Commits

Format: `type(scope): description`

Use the types and scope casing in the repository's `AGENTS.md`.

Example: `feat(Massif): add area validation`

## Branching

Branch from an updated `develop`:

```bash
git checkout develop && git pull
git checkout -b <type>/<scope>
```

Examples: `fix/entrance-decimal-validation`, `feat/cave-export`, `chore/upgrade-deps`

## Pull Request

**1. Write the body** — read `.github/pull_request_template.md`, fill it out, save to `pr_body.md`.

In the `## 🧪 Testing` section, write every test or verification as a GitHub
checklist item. Use `- [x]` only for checks that were actually run and passed,
and `- [ ]` for checks that are pending or were not run.

**2. Show and confirm** — display the title and the **actual content of
`pr_body.md`** to the user. If the user has already explicitly authorized
pushing and creating the PR, proceed. Otherwise wait for explicit approval.
The file must already exist on disk before asking for confirmation.

**3. Push and create:**

Identify the authenticated account with `gh api user --jq .login` before
creating the PR or requesting reviews. If the command fails or returns an
empty login, stop after the authentication recovery above; do not continue
with an unknown author. Compare reviewer logins to the author
case-insensitively.

The commands below work in bash and PowerShell. Create and assign the PR
first, then request each eligible reviewer separately. Omit a reviewer
command if that login is the PR author or already has a pending request.
If creation fails, stop; if it succeeds, use the returned PR number for
the review requests. If a reviewer request fails, report it and continue
with the other eligible reviewer and the verification below.

```bash
git push origin <branch-name>
gh pr create --title "<type(scope): description>" --body-file pr_body.md --base develop --repo <repo> --assignee "@me"
gh pr edit <pr-number> --repo <repo> --add-reviewer ClemRz
gh pr edit <pr-number> --repo <repo> --add-reviewer urien
```

Where `<repo>` is detected via `gh repo view --json nameWithOwner -q .nameWithOwner`.

For an existing PR, add only missing reviewers
other than the PR author with `gh pr edit <pr-number> --add-reviewer <login>
--add-assignee "@me"`; avoid re-requesting a review from someone already
requested. Verify the result with
`gh pr view <pr-number> --repo <repo> --json reviewRequests,assignees`.
Report any GitHub rejection instead of silently leaving the PR unassigned.

**4. Clean up:**

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
