# ADR 0001 — TanStack Query as the server-state layer

- **Status**: accepted → **migration complete (2026-08-12)**
- **Date**: 2026-08-11
- **Scope**: `packages/web-app`
- **Tracking issue**: [#1466](https://github.com/GrottoCenter/grottocenter-front/issues/1466)

## Context

The app manages server state by hand in Redux: 106 slices in `GCReducer` when this
was written, most of them `{ data, loading, error }` triplets caching an API response. 187 `dispatch(fetchX)`
call sites each repeat the same manual "don't refetch if already loaded or in flight"
guard. 28 new reducers were created in the 12 months preceding this decision — the
boilerplate is a recurring tax on every feature, not frozen legacy.

Three consequences, all observed:

- **Fetch bugs.** The `/api/convert` 429 loop: the reducer *does* record the
  failure, but `useProjections` guards its refetch on `(projections === null &&
  !loading)` — never on `error`. So on failure, `projections` stays `null`,
  `loading` drops back to `false`, and the effect fires again. No cache, no
  deduplication, no backoff — a single failure feeds a tight retry storm.
- **Redundant refetches.** Static reference data reloaded on every component mount.
- **Boilerplate.** Three files per endpoint, mechanically copied.

The team is already reimplementing React Query features by hand:
`useRefetchOnReconnect` (= `refetchOnReconnect`), `useJobPolling` (= `refetchInterval`
+ `retry`), `useReducerSuccessNotification` (= `onSuccess`).

## Decision

Adopt **TanStack Query** as the server-state layer. Redux is kept, reduced to real
client/session state.

| State | Tool |
| --- | --- |
| Server reads (GET: lists, details, stats, search) | React Query (`useQuery`) |
| Server writes (POST/PUT/PATCH/DELETE) | React Query (`useMutation` + invalidation) |
| Auth/session, i18n, language choice, UI preferences, side menu, global errors | Redux |
| Form state | React Hook Form |

Three sub-decisions:

1. **RTK Query is not adopted.** React Query migrates endpoint by endpoint without
   touching the existing store, and is reversible at any point.
2. **The store moves to `configureStore`** (`src/store.js`). This is unrelated to the
   point above: `configureStore` takes a plain combined reducer, so no reducer changes,
   and it removes the manual devtools/middleware wiring. `createStore` has been
   deprecated since Redux 4.2 and must not be copied into new code.
3. **The map does not migrate.** The viewport fetches in `actions/Map.js` are keyed on
   *continuous* bounds: every pan produces a different cache key, so there is no reuse
   to gain and the cache would grow without bound. React Query is for discrete,
   cacheable resources; a viewport stream is not one. Those thunks stay thunks.

## Consequences

### Required, non-negotiable

The app ships a service worker caching API responses with `NetworkFirst` (7-day
retention, 5s network timeout). The contract is: *the request always leaves*, and the
service worker answers from cache when the network is gone. React Query's default
`networkMode: 'online'` breaks that contract silently — it never calls the `queryFn`
while `navigator.onLine` is false, so the service worker is never consulted and an
offline user gets a permanent loading state instead of cached content.

`src/conf/queryClient.js` therefore pins `networkMode: 'offlineFirst'`, a capped
`retry`, and an explicit `refetchOnWindowFocus`. See the comments there — they are
load-bearing, not decoration.

A query whose retry is paused while offline reports `fetchStatus === 'paused'`, not an
error. UI that distinguishes offline from failure must read it (see
`components/common/FetchErrorState.jsx`).

When a screen migrates to `useQuery`, remove `useRefetchOnReconnect` from that screen
in the same change — `refetchOnReconnect` is on by default and the two would double up.

### Expected

- ~1 200 lines/year of boilerplate not written, at the observed rate of new endpoints.
- One class of bug removed: deduplication and staleness stop being hand-written.
- Bundle grows by ~12 KB gzip. Redux stays; this is not a size optimisation.
- Two cache layers coexist by design: React Query in memory (dedupes within a session),
  the service worker on disk (covers reloads and offline). Not redundant, layered.

### Risks

- Migration touches 187 call sites in a layer thinner on tests than the one it leaves
  (`reducers/` + `actions/` have 23 test files; 105 tests cover 480 components).
  Mitigated by migrating one coherent batch per PR, and by an offline check per PR.
- The half-migrated state — two paradigms, two caches — is worse than either end.
  Mitigated by keeping each domain independent and reversible: the migration can stop
  at any point in a coherent state.
- **401 is handled twice while both paradigms coexist.** Legacy thunks call
  `checkAuthStatus` (see `actions/utils.js`), and the `QueryClient` global
  `onError` dispatches `postLogout()` (see `conf/queryClient.js`). The two paths
  must stay aligned — if one drops the logout dispatch, the user experience of
  a session expiry will depend on which layer fired the request. Converges to a
  single path only once the last thunk is migrated.

### Conventions

- **List hooks** (`useLanguages`, `useSubjects`, `useDocumentTypes`, …) return
  the raw `useQuery` object. Callers destructure and default the list:
  `const { data: languages = [], isLoading } = useLanguages();`. That keeps
  `refetch`, `isFetching`, `isPending`, `error` at hand without a wrapper that
  would hide them.
- **Transformed hooks** (`useFileFormats`) expose the derived fields at the top
  level of the return, alongside `isLoading` and `error` — same names as
  `useQuery` so the two shapes never disagree.
- **Options** go in an object, not positional arguments:
  `useLicenses({ enabled: showAuthorization })`. Positional booleans do not
  survive the second option being added.
- **Sorting and shaping** go inside `select`, at module scope so the identity
  is stable across renders. The array is copied first — `select` receives the
  cache array itself and mutating it corrupts what every other observer reads.
- **Cross-caller lookups** (`findLicenseByName`, and future siblings) are
  colocated with their hook and re-exported from `hooks/index.js`. A
  `licenses.find(l => l.name === x)` reinvented in three components is the
  duplication this migration is meant to remove, not accumulate.

## Migration completed (2026-08-12)

The endpoint-by-endpoint migration reached its stable end state.

### Final state

- **GCReducer: 106 slices → 7.** Redux keeps only genuine client/session
  state: `account`, `login`, `intl`, `sideMenu`, `error`, `map` (viewport
  carve-out), `importWizard` (multi-step wizard client state). Every
  other slice's server-state was replaced by a React Query hook in
  `src/hooks/queries/` or `src/hooks/mutations/`, re-exported from
  `src/hooks/index.js`.
- **Scaffolds removed** (all in the same migration): the middleware
  bridge `queryInvalidationBridge`, the `queryClientRef` singleton, the
  `mapCacheInvalidationMiddleware`, and three hand-rolled hooks —
  `useReducerSuccessNotification`, `useJobPolling`,
  `useLanguages`-style ref-list fetchers. Every mutation invalidates
  directly from its own `onSuccess`.
- **`isomorphic-fetch` dependency dropped.** Every remaining call site
  uses the platform's global `fetch`. Vite bundles for the browser
  (native fetch on all supported targets); the vitest jsdom env has
  fetch on `globalThis`. See I3 in the roadmap.

### What did NOT migrate (and why)

- **Viewport map fetches** (`actions/Map.js`). Continuous-bounds queries
  produce a different cache key on every pan — no reuse to gain, and
  the cache would grow without bound. Kept as thunks, per the carve-out
  in the original Decision section above.
- **`importWizard` slice.** Multi-step client state (file, encoding,
  header row, column mappings, context, wizard step). A few sub-fetches
  colocate with the wizard reducer to keep step transitions atomic —
  they are not new endpoints, so leaving them in Redux is not a
  regression.
- **`useRefetchOnReconnect` hook.** Kept for three legitimate callers
  outside the RQ scope: the viewport map, the intl locale reload, and
  the map tile cache reload. React Query's `refetchOnReconnect` covers
  RQ queries only.
- **`checkAuthStatus` helper.** Still used by the remaining thunks that
  live in the anti-scope (Account fetches, importWizard step fetches,
  the Substance/PreviewSensitiveMassif thunks). The QueryClient's
  global `onError` handles 401 for RQ. Two paths for now — the
  "handled twice" risk from the Risks section above collapses when the
  last thunk migrates, which is scoped for a follow-up.

### The 401 handling risk noted above

The "handled twice" risk in the Risks section is largely mitigated but
not fully eliminated. All RQ queries and mutations hit the single
`onError` in `conf/queryClient.js` (dispatches `postLogout()` on 401).
The remaining thunks (see above) still call `checkAuthStatus` directly;
both paths converge on `postLogout()`, so a real 401 lands the user on
the same login flow regardless of which layer fired the request. When
the last of those thunks migrates, `checkAuthStatus` disappears
entirely and this paragraph closes.

### Notable in-flight design choices worth remembering

- **Advanced search** uses a module-scope `useSyncExternalStore`
  singleton (`hooks/queries/useAdvancedSearch.js`) to share the
  currently submitted params between the form and the results
  component. Only one advanced search is active app-wide at any time
  — the singleton matches that semantic without a context provider.
- **`isNewQuery` flag** on advanced-search: preserved as a coordination
  signal for `DesktopEntityTable`/`MobileEntityList` to reset
  pagination/sort/selection on a fresh submit. The flag flips back to
  `false` from a `useEffect` once RQ finishes fetching, so a subsequent
  submit re-fires the reset.
- **FormData mutations** (`useCreateDocument`, `useUpdateDocument`) go
  through `apiPostForm`/`apiPutForm` in `api/client.js`. They bypass
  `jsonHeaders()` on purpose — the browser must set the multipart
  Content-Type so the boundary is included.
- **MFA hooks** (`hooks/mutations/useMfa.js`) use a small raw fetch
  helper (not `apiPost`) because the enroll/verify calls carry the
  enrollment token, not the standard authorization header. Login-slice
  dispatches (`fetchLoginSuccess`, `hideLoginDialog`, `postLogout`) are
  wired into `store.dispatch` from within the mutation so the
  login flow stays single-sourced.

### Metrics

- **106 → 7** slices in `GCReducer.js`.
- **~30** query/mutation hook files under `hooks/queries/` and
  `hooks/mutations/`.
- **1** dependency dropped (`isomorphic-fetch`, `-152.99 KiB` per
  `yarn install`).
- **0** additions to the middleware chain in `store.js` from this
  migration (the two RQ-related middlewares were added and removed
  during the migration; the store today is `configureStore` on a bare
  combined reducer).
