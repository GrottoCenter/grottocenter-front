---
name: fix-review
description: Given a PR number, find the latest change-request comment from someone else, judge whether it's worth applying, fix what's relevant, push, and reply on the PR explaining what was fixed and what wasn't (and why).
argument-hint: "<pr-number>"
---

You are resolving reviewer feedback on an existing pull request. `$ARGUMENTS` is the PR number — if missing, ask the user for it before doing anything else.

## 0. Prerequisites

```bash
gh --version
gh auth status
```

If `gh` is missing or unauthenticated, stop and tell the user (see `github-workflow` skill for install/auth instructions).

Resolve identity and repo once, reuse throughout:

```bash
gh api user -q .login                                  # my own GitHub login
gh repo view --json nameWithOwner -q .nameWithOwner     # owner/repo
```

## 1. Check out the PR safely

Run `git status` first. If there is uncommitted work that isn't yours to discard, stop and ask the user how to proceed (stash vs. abort) — do not check out over unsaved changes.

```bash
gh pr checkout <pr-number>
```

## 2. Gather all feedback, chronologically

Pull all three comment sources for the PR — a "change request" can live in any of them:

```bash
gh api repos/{owner}/{repo}/issues/{pr-number}/comments --paginate      # general PR comments
gh api repos/{owner}/{repo}/pulls/{pr-number}/reviews --paginate       # review submissions (body + state)
gh api repos/{owner}/{repo}/pulls/{pr-number}/comments --paginate      # inline review comments (path/line/diff_hunk)
```

Merge all entries by `created_at`/`submitted_at`, drop anything authored by your own login (from step 0).

## 3. Identify the target comment

Walk backward from the most recent non-self entry. Pick the most recent one that is **actually actionable** — a review with `state: CHANGES_REQUESTED`, an inline comment pointing at specific code, or a general comment with a concrete ask. Skip over comments that are just acknowledgements, questions with no ask, or approvals — don't stop at the newest comment just because it's newest if it has nothing to act on.

If no qualifying comment exists at all, tell the user and stop — do not invent work.

## 4. Evaluate relevance before touching anything

A comment may bundle several distinct asks — treat each one separately. For each:

- Read the referenced code (inline comments carry `path` + `line`/`diff_hunk` — read the current state of that file, not just the diff hunk, since the PR may have moved on).
- Judge it against this project's conventions (`AGENTS.md`) and the actual current code — not against how easy it is to apply.
- If an ask is ambiguous, conflicts with a documented convention, requires a product/design call, or its intent doesn't survive contact with the current code — **stop and ask the user** (`AskUserQuestion` or plain text) instead of guessing. Never silently skip an ask without recording why, and never silently implement a guess for something unclear.

## 5. Fix what's relevant

Apply only the asks that passed evaluation, following `AGENTS.md` conventions (PropTypes, hooks over containers, no state mutation, `@` alias for new 2+-level-deep imports, i18n keys, etc.). Run `yarn lint` before committing.

## 6. Commit and push

Conventional commit, scope required:

```bash
git add <files>
git commit -m "<type>(<scope>): <description>"
git push
```

Keep it in one commit unless the fixes are clearly unrelated to each other.

## 7. Reply on the PR

Write in English (project convention). For each ask from the target comment, state the outcome plainly — no filler:

- ✅ Fixed — what changed, in a sentence.
- ⏭️ Not fixed — the specific reason (out of scope, conflicts with `<convention>`, needs a decision, etc.).

If the target was an **inline review comment**, reply inside its thread so context is preserved:

```bash
gh api repos/{owner}/{repo}/pulls/{pr-number}/comments \
  -f body="<reply>" -F in_reply_to=<original_comment_id> --method POST
```

If it was a **general comment** or a **review body** with no single inline comment to thread on, post a normal PR comment instead:

```bash
gh pr comment <pr-number> --body-file reply_body.md
```

Clean up any temp body file afterward.

## Notes

- If nothing in the target comment is actually actionable after evaluation (all asks rejected), still commit nothing, skip step 6, and post the reply explaining why each ask was declined.
- Never touch comments authored by the user themselves, and never treat their own follow-up remarks as something to "resolve."
