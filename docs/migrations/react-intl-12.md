# React Intl 8 to 12

This batch implements the React Intl migration from
[issue #1391](https://github.com/GrottoCenter/grottocenter-front/issues/1391).
The application now uses `react-intl` 12.1.4 with the existing caret range.

## Compatibility

The migration follows the official [v10 guide](https://formatjs.github.io/docs/react-intl/upgrade-guide-10.x/)
and [combined v11/v12 guide](https://formatjs.github.io/docs/react-intl/upgrade-guide-12.x/).
Version 11 was a transition release; the target is the stable 12.x line.

- React 19 satisfies the React 18 minimum.
- No application imports use the removed `injectIntl`, `WrappedComponentProps`
  or `WithIntlProps` exports, or the removed global context workaround.
- `IntlProvider` is now a function component. The application does not access
  provider instances through refs or class methods.
- Existing `useIntl`, `FormattedMessage`, `defineMessages` and plain JavaScript
  message descriptors remain supported. The v12 changes to message argument
  generics and readonly helper results concern TypeScript consumers; this batch
  does not introduce typed descriptors into the JavaScript application.
- The Redux locale loader, provider hierarchy, missing-translation error
  handler and translation catalogues retain their existing behavior.

## Regression coverage

`packages/web-app/src/intl.test.jsx` exercises the installed library with real
English and French catalogues:

- switching locale and catalogue updates ICU singular, plural and zero forms;
- React links embedded in translated plural messages remain usable;
- `useIntl` date and number formatting updates when the locale changes;
- rich-text tags retain their React callbacks;
- missing messages retain their default-message and message-id fallbacks and
  report `MISSING_TRANSLATION` to the provider's error handler.

Validation passed:

- `yarn.cmd test --run --maxWorkers=2 --testTimeout=15000`: 188 files,
  1,285 tests.
- Focused locale-loader, notification and migration tests: 17 tests.
- ESLint on `src/intl.test.jsx`: no errors or warnings.
- `yarn.cmd build`: production bundle and PWA generation.
- `yarn.cmd install --immutable` and `git diff --check`.

The worker limit and explicit test timeout accommodate slower machines.
