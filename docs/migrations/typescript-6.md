# TypeScript 5.9 to 6

This batch implements the TypeScript and import-resolver evaluation from
[issue #1391](https://github.com/GrottoCenter/grottocenter-front/issues/1391).
The root development dependency is pinned to TypeScript 6.0.3.

## Configuration

The [TypeScript 6 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)
deprecate `baseUrl`, the ES5 target and the legacy Node module resolver.

- Remove `baseUrl` from both the shared and application tsconfig. The existing
  `@/*` mapping already uses `./src/*`, relative to the application tsconfig,
  and stays aligned with Vite's alias without a lookup root for bare imports.
- Prefix the root tsconfig's `@grotto-front/web-app` target with `./` as well.
  Cypress resolves that tsconfig during startup and rejects non-relative
  `paths` targets when the shared `baseUrl` is removed.
- Use `moduleResolution: bundler` in the shared configuration, matching the
  application's existing Vite configuration. Raise the shared package's
  minimum TypeScript peer to 5, which introduced this resolution mode.
- Use the explicit ES2022 target instead of ES5. Vite still owns the browser
  build target; the application's `noEmit` setting remains enabled.
- Keep the existing project includes, JSX mode and strictness settings.
  TypeScript 6's default project root contains `src`, `cypress` and `.storybook`.

## Resolver compatibility

`eslint-import-resolver-typescript` 4.4.5 is already current. Its runtime uses
`get-tsconfig` to read project configuration and `unrs-resolver` for resolution;
it does not call the TypeScript compiler API or require a TypeScript version
through a peer dependency. No resolver bump is necessary.

Yarn 4.5 reports `YN0066` because its optional built-in TypeScript compatibility
patch cannot be fully applied to 6.0.3. The project uses `nodeLinker: node-modules`,
so the PnP patch is not needed. Yarn falls back to the original package sources;
the [Yarn FAQ](https://yarnpkg.com/getting-started/qa) documents this behavior.
The compiler API and project checks below validate the installed package.

The migration checks JavaScript and JSX `@/` aliases, packages with export maps
(`react-intl`, `storybook/actions`, `react-to-print`) and rejection of a missing
alias target, before and after removing `baseUrl`.

## TypeScript 7 decision

TypeScript 7.0.2 is published, but it is not a compatible replacement for all
installed tooling. Its root package export exposes version information rather
than the old JavaScript compiler API. The installed
`@joshwooding/vite-plugin-react-docgen-typescript`, supplied by Storybook's React
Vite integration, still imports `typescript` and calls `readConfigFile`,
`parseJsonConfigFileContent`, `sys` and `flattenDiagnosticMessageText`.

The application currently uses Storybook's default JavaScript docgen mode, but
replacing TypeScript with 7 would leave the installed TypeScript docgen path
incompatible. Keep 6.0.3 as the supported compiler API dependency rather than
installing a second compiler that this JavaScript application does not need.
Microsoft's [compiler API documentation](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
also distinguishes the API for versions below 7 from the new API.

Revisit 7 when the installed Storybook TypeScript docgen integration supports
the native API, or when that integration is removed through a separate tooling
decision. The original 5.9-to-6 migration is complete independently of that
future evaluation.

## Validation

- `yarn.cmd exec tsc --project packages/web-app/tsconfig.json --noEmit`: passed.
- Compiler API and shared/application tsconfig parsing: passed without
  configuration diagnostics or a deprecation-suppression setting.
- Direct invocation of the installed Storybook TypeScript docgen configuration
  parser: passed.
- Resolver checks before and after the migration: JS/JSX aliases, dependency
  export maps and missing-module rejection passed.
- ESLint on the migration tests, mobile side menu, Storybook configuration and
  Vite configuration: no errors or warnings.
- `yarn.cmd build` and
  `yarn.cmd workspace @grotto-front/web-app build-storybook`: passed.
- React Intl migration tests after the tsconfig changes: all five passed with
  `--maxWorkers=1 --testTimeout=15000 --reporter=verbose`.
- `yarn.cmd install --immutable` and `git diff --check`: passed.
- After correcting the root alias, TypeScript 6.0.3 parsed both tsconfigs
  without diagnostics and checked the application project with `--noEmit`.
  Cypress 15.19.0 verified startup; the complete E2E suite passed locally
  against a production preview in Electron (7 specs, 32 tests). The original
  PR run failed before tests in every E2E job because Cypress rejected the
  root alias without `baseUrl`.

The preceding React Intl batch passed the full Vitest suite (188 files and
1,285 tests). This batch changes tooling and configuration; the targeted rerun,
compiler and resolver checks, and both builds validate its consumers.
