# Code Review Response — feature/dataquality-sort

## Bug Fixes (Outside Review Scope)

**`PersonSearch` — AUTHOR filter wrongly excluded all non-author persons**
`filter: { type: 'AUTHOR' }` was hardcoded in `PersonSearch.jsx`, silently restricting every person search to authors only. Users (cavers with an account) were never returned. Fixed by removing the filter (`filter: {}`).

---

## Issues (Must Fix)

**1. `StyledTablePagination` missing `page={page}` — regression**
Fixed. `page={page}` restored to `StyledTablePagination` in `DesktopEntityTable.jsx`.

**2. UTF-8 BOM in 6 lang files**
Fixed. BOM (`EF BB BF`) removed from `bg.json`, `ca.json`, `de.json`, `fr.json`, `he.json`, `id.json` using raw byte detection and rewrite.

---

## Suggestions (Should Consider)

**3. `fetchFieldSearch` county effect — no unmount cleanup**
Fixed. Added `let cancelled = false` flag with `return () => { cancelled = true; }` in the county `useEffect` in `EntrancesList/index.jsx`.

**4. `fetchFieldSearch` massif effect — same issue**
Fixed. Same `cancelled` flag pattern applied to the massif `useEffect`.

**5. `EntitySearchPage` — `initialFilter` eslint-disable unexplained**
Fixed. Added a comment above the `eslint-disable` line explaining that `initialFilter` is intentionally excluded and that consumers must use `key={searchKey}` to trigger re-fetches.

**6. `DesktopEntityTable.handleRowClick` — always opens `_blank`, no mobile-aware navigation**
Fixed. Replaced the manual `isMobile ? navigate(url) : window.open(url, '_blank')` pattern with the existing `useOpenLink` hook, which encapsulates this logic. Documented the hook usage in `packages/web-app/AGENTS.md`.

**7. `MobileEntityList` — `isAppending` ref contract is implicit and fragile**
Fixed. The ref comment was added, then superseded by a proper fix: `isNewQuery` prop is now passed from `EntityTable` to `MobileEntityList`. A dedicated `useEffect` on `isNewQuery` explicitly resets `allRows`, `page`, and `isAppending.current` when a new search fires, removing reliance on the ref heuristic.

**8. `"Sort by"` key untranslated in 13 language files**
Fixed. Translated in all 13 non-French language files (ar, bg, ca, de, el, es, he, id, it, ja, nl, pt, ro).

---

## Nitpicks (Optional)

**9. `FixedContent.jsx` — `title != null` too broad**
Fixed. Replaced with `title !== undefined && title !== null` (strict equality, no coercion).

**10. `EntrancesSearch.jsx` — redundant template literals around `formatMessage`**
Fixed. Removed backtick wrappers from `formatMessage({ id: 'Ease of reach' })` and `formatMessage({ id: 'Ease of move' })`.

**11. `entitiesConfig.jsx` — formatting-only changes inflate the diff**
Noted. Not reverted in this PR — the formatting was a side-effect of adding the `massifs` column. Will keep formatting and functional changes together in future PRs when the scope is small.

**12. `DataUsageIcon` — semantic fit for "data quality"**
Not changed. `DataUsageIcon` was kept: it is already used as the GrottoCenter data quality icon elsewhere in the UI and is visually recognizable to users in that context.
