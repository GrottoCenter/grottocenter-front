# MUI 7 to 9

This migration implements the MUI batch from [issue #1391](https://github.com/GrottoCenter/grottocenter-front/issues/1391).
The reference is the [official v9 migration guide](https://mui.com/material-ui/migration/upgrade-to-v9/).

## Dependencies and compatibility

- Material, icons and system are pinned to `9.4.0`.
- Lab is pinned to `9.0.0-beta.9`; its Timeline components remain in use.
- The existing date pickers `9.14.0` support Material/System 9.
- React 19, Emotion 11 and Node 24 satisfy the relevant requirements.
- The browser baseline rises to Chrome 117, Edge 121, Firefox 121 and
  Safari/iOS 17. Older browsers are outside MUI 9's supported baseline.

## Application changes

- System props on Box, Stack, Grid, Typography and Timeline components move
  into `sx`, including components wrapped with `styled()`.
- Deprecated field, checkbox, switch, dialog, menu and popover props move to
  `slots` or `slotProps`. Nested Select menu props are migrated as well.
- Autocomplete's `renderInput` parameters now expose `slotProps.input` and
  `slotProps.htmlInput`. Custom fields preserve those refs and handlers when
  adding adornments or accessibility attributes. Author chips use `renderValue`.
- Removed `*Outline` icon exports use their equivalent `*Outlined` exports.
  Other icon names, such as `DriveFileRenameOutline`, remain valid.
- Vertical Grid containers become Stack; obsolete Grid `item` props are removed.
- Buttons rendered through AppLink explicitly declare `nativeButton={false}`.
- StepConnector styles use the orientation class on the root rather than
  removed orientation-specific line classes.

MenuItem and Tab now require their respective menu/tab contexts, keyboard
navigation uses a roving tab index, and Stepper renders an ordered list.
LinearProgress exposes the precise value in `aria-valuenow` rather than
rounding it; the progress test checks its numeric value.
These changes matter to accessibility and DOM-based tests even when the page
looks unchanged.

## Mobile drawer regression

The old 7.3.9 pin avoided a Slide regression that reset the drawer to its fully
open position when closing after a partial swipe. In 9.4.0, Slide recognizes
SwipeableDrawer's gesture transform and preserves it during exit.

`cypress/e2e/mobile-side-menu.cy.js` checks the drawer's position frame by frame
after release, then verifies that it closes and can be reopened. A Chromium
touch smoke test also exercised the real touch input path: the drawer continued
from -140px to -240px without returning toward the open position.

Restart Vite with `yarn start --force` after changing dependencies so that the
browser tests the new prebundled code.

## Validation

- ESLint on the modified source files: no errors or warnings.
- Production build, including service worker generation: passed.
- Storybook build: passed. Its Vite configuration excludes the app's PWA
  plugins so that Workbox does not try to precache Storybook's manager bundle.
- Autocomplete focus and keyboard selection: passed in a new unit test.
- Tests for button/alert states and wizard progress were adapted to MUI 9's
  classes and ARIA precision, then passed on rerun.
- The initial complete Vitest run passed 175 files. Its three assertion failures
  were addressed above; eight other files hit worker startup timeouts on the
  loaded Windows host. Rerunning those eight files alone with one worker passed
  all 59 tests, with no worker errors.
- Cypress: the partial-swipe test passed; all 17 page smoke tests passed with
  `defaultCommandTimeout=15000`. The first map check exceeded the default 4s
  while its lazy module was loading.

Unit checks use `--maxWorkers=2 --testTimeout=15000` for the complete suite and
`--maxWorkers=1 --testTimeout=15000` for targeted reruns. On Windows, Cypress
was launched with `ELECTRON_RUN_AS_NODE` cleared in the child shell; the IDE
environment sets it to `1`.
