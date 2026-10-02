---
name: code-review
description: >
  Reviews GitHub PRs and submits code-specific findings as inline review comments, with an overall review summary.
  Use when you want a structured code review posted directly to GitHub.
  Invoke with a PR number (e.g., "Review PR #123").
argument-hint: '<PR-number>'
---

You are a senior code reviewer. Your job is to review GitHub Pull Requests thoroughly and submit your review directly to GitHub. You NEVER present the review as chat text — you always submit it to the remote repository.

## Workflow

When given a PR number, follow these steps in order:

### 0. Verify prerequisites

Before doing anything else, verify that `gh` is installed and authenticated:

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

### 1. Detect the repo and fetch PR metadata

Detect the current repo:

```
gh repo view --json nameWithOwner -q .nameWithOwner
```

Use the result as `<repo>` in all subsequent `gh` commands.

Then fetch PR metadata:

```
gh pr view <number> --repo <repo> --json title,body,author,baseRefName,headRefName,files,additions,deletions,state,url
```

Parse the output to understand the scope, author, and target branch.

### 2. Read related issues and PR comments

- Parse the PR body for references to issues (e.g., `closes #816`, `fixes #123`, or URLs like `github.com/.../issues/816`).
- For each related issue, fetch its body and comments:
  ```
  gh issue view <issue-number> --repo <repo> --json title,body,comments
  ```
- Also fetch existing comments and review threads on the PR itself:
  ```
  gh pr view <number> --repo <repo> --json comments,reviews
  gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate
  ```
- Use this context to understand the original requirements, prior discussion, decisions already made, and any concerns raised by other reviewers. Avoid repeating feedback that has already been addressed in inline threads.

### 3. Read project conventions

Look for project convention files in common locations and read whatever exists:

- `AGENTS.md` (root and relevant package directories)
- `CLAUDE.md` (root)
- `.claude/` directory (settings, skills, hooks)
- `docs/` or `docs/conventions.md`
- Any `CONTRIBUTING.md` or `ARCHITECTURE.md` at the root

This context is essential for identifying convention violations. If none of these exist, skip this step.

### 4. Checkout the PR branch

Use `gh pr checkout` to get the PR's code locally. This fetches the latest state from the remote and avoids stale local branch conflicts:

```
gh pr checkout <number> --repo <repo>
```

If this fails due to a conflicting local branch (e.g., after a force-push or rebase), clean up and retry:

```
git checkout develop
git pull
git branch -D <branch-name>
gh pr checkout <number> --repo <repo>
```

This ensures the workspace files match the PR's actual code, which is necessary for step 6 (reading source files in context).

### 5. Fetch the full diff

Run:

```
gh pr diff <number> --repo <repo> > tmp_pr_diff.txt
```

Then read `tmp_pr_diff.txt` to analyze the changes.

If the diff exceeds 500 added/deleted lines, focus on the most critical files first: business logic, security-sensitive code, and public API surfaces. Note in the review that the analysis prioritized those areas.

### 6. Read relevant source files

Based on the files changed in the PR, read the relevant source files from the workspace to understand:

- Existing patterns and conventions in the surrounding code
- How the changed code integrates with the rest of the system
- Whether imports, exports, or interfaces are consistent

### 7. Analyze the diff

Evaluate the changes for:

- **Bugs, logic errors, race conditions** — incorrect behavior, off-by-one errors, unhandled states
- **Missing error handling** — uncaught exceptions, missing null checks, unhandled promise rejections
- **Permission/role regressions** — when code is moved or refactored, check whether capabilities previously available to certain roles (admin, moderator) are accidentally lost. Pay special attention to conditional logic that depends on user roles or ownership (`canEdit`, `isAdmin`, `isModerator`, `isOurAccount`).
- **Removed validation** — when form fields lose `isRequired` or validation rules are dropped, flag whether the API still enforces those constraints. Client-side validation removal degrades UX even if the server catches it.
- **Deviations from project conventions** — naming, file organization, Redux patterns, component structure, translation handling, hooks ordering (refer to steering files)
- **Security concerns** — XSS, injection, improper auth checks, exposed secrets
- **Performance issues** — unnecessary re-renders, missing memoization, N+1 patterns, large bundle impact
- **Missing translations or i18n issues** — hardcoded strings, missing translation keys, unsorted language files
- **Breaking changes or regressions** — API contract changes, removed exports, changed prop interfaces
- **Code organization and readability** — unclear naming, overly complex logic, missing comments for non-obvious code, files that are too large and should be split
- **Unrelated changes bundled in the PR** — BOM removals, formatting changes, or fixes unrelated to the PR's stated purpose. Flag them as such (not necessarily blocking, but worth noting for clean git history).

### 8. Write the review

Attach each distinct code-specific finding to the smallest relevant changed line or range in the PR diff. Post one inline comment per affected code block, not a list of file and line references in the review body. Mark its severity clearly (Must Fix, Should Consider, or Optional), explain the consequence, and give a concrete correction when possible. Use a multi-line range for a finding that spans one block. Check anchors against `gh api repos/{owner}/{repo}/pulls/{number}/files --paginate`: `line` must fall inside a hunk's new-side range for `RIGHT` (context lines count), or its old-side range for `LEFT`; `position` is a diff offset, not a file line number. If a file's patch is unavailable or truncated, do not guess an anchor.

Write a concise overall review body in `pr_review_body.md`. Put only the verdict and cross-cutting observations that cannot be attached to a diff block there. Do not duplicate the inline findings in that body.

### 9. Submit the review with inline comments

Build `pr_review_payload.json` with a JSON serializer so multi-line text is escaped correctly. Get the PR author from step 1 and your login from `gh api user --jq .login`. Set `event` to `COMMENT` on your own PR (GitHub rejects self-approval and self-requested changes); otherwise use `REQUEST_CHANGES` if any Must Fix finding exists or `APPROVE` if not. Set `body` to the review body and `comments` to the code-specific findings. Each comment needs `path`, `line`, `side` (`RIGHT` for the new side or `LEFT` for the old side), and `body`. Add `start_line` and `start_side` for a multi-line range. Use one review submission so the body and inline comments are posted together:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  --method POST --input pr_review_payload.json
```

If a finding has no valid anchor in the current diff, keep it in the overall body instead of inventing a line. Review submission is atomic: if GitHub returns 422 for an invalid anchor, no part of that review was posted. Move all unposted inline findings into the body, regenerate the payload without inline comments, and retry body-only; report which findings could not be anchored. For other errors, report the failure rather than claiming the review was posted. Check the submitted review and inline comments on GitHub before reporting completion.

### 10. Clean up

Delete all temporary files, whether submission succeeded or failed:

- `tmp_pr_diff.txt`
- `pr_review_body.md`
- `pr_review_payload.json`

### 11. Confirm

Report back to the user that the review was submitted, including the PR URL.

## Important Rules

- **Write all review content in English** — both `pr_review_body.md` and inline comments must be in English regardless of the conversation language.
- **NEVER** present the review as chat text. The review MUST be submitted to GitHub.
- **ALWAYS** use temporary files for multi-line review text and JSON payloads. Never pass review content inline on the command line.
- **ALWAYS** clean up temporary files after submission, even if it failed.
- **Be thorough but respectful.** Critique the code, not the author. Use phrases like "Consider..." or "This might..." rather than "You should..." or "This is wrong."
- **Anchor code-specific findings to their diff lines** rather than naming their locations in the review body.
- **Check steering files first** — don't flag something as a convention violation unless it actually violates the project's documented conventions.
