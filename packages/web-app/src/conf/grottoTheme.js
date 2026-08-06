import { brown, blue, orange, grey } from '@mui/material/colors';
import { createTheme, alpha } from '@mui/material/styles';

const fontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"'
].join(',');

const sideMenuWidth = 240;
// Width of the desktop rail once collapsed. The rail never goes to 0: on
// desktop the navigation stays visible at all times, it only trades its labels
// for icons.
//
// NOT a free parameter — it is twice the expanded icon centre, so that the icon
// column does not jump sideways when the rail folds. With SideMenu's 8px content
// inset, an 8px item inset and MENU_ICON_SIZE (32) icons, that centre is at 32:
//   8 + 8 + 32/2 = 32  →  rail = 64
// At that width the collapsed icons also land on the same 16px left edge as the
// expanded ones, so neither the centres nor the edges move. Change any of those
// three inputs and this has to be recomputed with them.
const sideMenuCollapsedWidth = 64;
const appBarHeight = 56;
const breadcrumpHeight = 24;
const paddingUnit = 8;

export const overridings = {
  name: 'Main theme',
  // Standard MUI spacing: theme.spacing(factor) = factor * 8px.
  // Use fractional factors (0.25, 0.5, 1.5, ...) freely — unlike the previous
  // custom array-based scale, they resolve correctly instead of being dropped.
  spacing: paddingUnit,
  sideMenuWidth,
  sideMenuCollapsedWidth,
  appBarHeight,
  breadcrumpHeight,
  palette: {
    primary: {
      veryLight: brown['100'],
      light: brown['500'],
      main: brown['700'],
      dark: brown['900'],
      contrastText: grey['100']
    },
    secondary: {
      veryLight: orange['50'],
      light: orange['500'],
      main: orange['700'],
      dark: orange['900'],
      contrastText: grey['900']
    },
    text: {
      primary: alpha('#000000', 0.95),
      secondary: alpha('#000000', 0.75),
      disabled: alpha('#000000', 0.38)
    },
    common: {
      white: '#fff',
      black: '#000'
    },
    onPrimary: {
      main: grey['100']
    },
    action: {},
    // Page vs. surface separation. `default` tints the app background a light
    // grey (applied to <body> by CssBaseline) so that white cards/Paper — which
    // use `paper` — visibly float instead of blending into a white-on-white
    // page. Reuses the existing grey scale rather than introducing new colours.
    background: {
      default: grey['100'],
      paper: '#fff'
    },
    contrastThreshold: 3,
    primary1Color: brown['500'],
    primary2Color: brown['700'],
    primary3Color: brown['100'],
    secondary1Color: blue['500'],
    secondary2Color: blue['700'],
    // Custom legacy palette keys used by domain-specific components
    // (e.g. MapColumnsStep uses secondary3Color for timestamp column highlights)
    secondary3Color: blue['100'],
    secondary4Color: blue['300'],
    accent1Color: orange['500'],
    primaryTextColor: grey['900'],
    secondaryTextColor: grey['600'],
    textIconColor: '#FFFFFF',
    borderColor: grey['300'],
    divider: grey['300'],
    darkBlack: '#000000',
    fullBlack: '#000000',
    secondaryBlocTitle: '#FFFFFF',
    blackShadow: alpha('#000000', 0.117647),
    backgroundButton: '#FFFFFF',
    // Icon colour for map controls (location, compass, data toggle). Matches
    // Leaflet's built-in control icons (zoom, layers) so every map button looks
    // uniform.
    mapControlIcon: '#333333'
  },
  shape: {
    borderRadius: 4
  },
  // Root font-size is the browser default (16px): 1rem = 16px. The app used to
  // pair Skeleton-CSS's `html { font-size: 62.5% }` with `htmlFontSize: 10`,
  // which silently rendered every third-party stylesheet written for a 16px
  // root at 62.5% of its intended size. Never reintroduce `htmlFontSize`.
  //
  // One scale, three heading roles: h1 = page title, h2 = section (card)
  // title, h3 = subsection. h4-h6 are item-level. Every level states its own
  // weight — relying on MUI's defaults left h1/h2 at 300 (light), which read as
  // washed out at large sizes.
  //
  // Only h1 is fluid. It is the one level whose range is wide enough (26->32)
  // for the stepping to be visible while resizing; every level below spans two
  // pixels at most, where a clamp() costs a three-number contract and buys
  // nothing you can see. Keeping the rest static also removes a whole class of
  // bug: with a fluid level, it is its *minimum* — not its maximum — that has
  // to clear the static level below, and getting that wrong inverts the
  // hierarchy on phones only.
  //
  // The middle term mixes `rem` with `vw` (never `vw` alone) so browser zoom and
  // the user's default font size still scale the text — a `vw`-only value would
  // break WCAG 1.4.4.
  //
  // Deliberately NOT wrapped in responsiveFontSizes(): its `remFontSize <= 1`
  // guard and its `min = 1 + (max - 1) / factor` formula are both anchored to a
  // literal 1rem, so it silently rescaled every variant when the root font-size
  // changed (it used to shrink body text to 13px below the lg breakpoint).
  typography: {
    fontFamily,
    h1: {
      // 24.4 at 360px, 32 from 1200px up. The floor stays above h2 (23).
      fontSize: 'clamp(1.525rem, 1.26rem + 0.72vw, 2rem)',
      fontWeight: 600,
      lineHeight: 1.2
    },
    h2: {
      fontSize: '1.4375rem', // 23
      fontWeight: 550,
      lineHeight: 1.2
    },
    h3: {
      fontSize: '1.25rem', // 20
      fontWeight: 550,
      lineHeight: 1.3
    },
    h4: {
      fontSize: '1.125rem', // 18
      fontWeight: 550
    },
    h5: {
      fontSize: '1rem', // 16
      fontWeight: 550
    },
    h6: {
      fontSize: '0.875rem', // 14
      fontWeight: 550
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500
    },
    // Body text steps down one notch on phones to claw back some density,
    // but stops at 15px: below 16px iOS Safari auto-zooms on focused inputs,
    // and the old implicit 13px (a side effect of responsiveFontSizes, never a
    // deliberate choice) is under common legibility minimums.
    // `sm` is MUI's default 600px — the theme does not override breakpoints.
    body1: {
      fontSize: '0.9375rem', // 15
      fontWeight: 400,
      '@media (min-width:600px)': {
        fontSize: '1rem' // 16
      }
    },
    body2: {
      fontSize: '0.8125rem', // 13
      fontWeight: 400,
      '@media (min-width:600px)': {
        fontSize: '0.875rem' // 14
      }
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400
    }
  },
  components: {
    MuiTooltip: {
      defaultProps: {
        arrow: true
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'filled'
      }
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained'
      }
    },
    // Breadcrumbs are secondary navigation, so they sit at body2 (14px) rather
    // than competing with the page title. Centralised here because the same
    // hard-coded size used to be copy-pasted into every detail page.
    MuiBreadcrumbs: {
      styleOverrides: {
        // Spread the whole variant, not just `.fontSize`: body2 carries a
        // nested media query for phones, which reading a single key drops.
        root: ({ theme }) => ({
          ...theme.typography.body2
        }),
        separator: ({ theme }) => ({
          marginLeft: theme.spacing(0.25),
          marginRight: theme.spacing(0.25),
          [theme.breakpoints.up('md')]: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1)
          }
        })
      }
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: brown['100']
        },
        pulse: {
          animationDuration: '1s'
        }
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: brown['500'],
          fontSize: '0.8125rem'
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(1),
          [theme.breakpoints.up('md')]: {
            padding: theme.spacing(2)
          },
          // MUI ships `&:last-child { padding-bottom: 24px }` to leave room for
          // CardActions. Our cards have none, so it just adds an unbalanced
          // band under the content. Realign it with the padding above.
          '&:last-child': {
            paddingBottom: theme.spacing(1),
            [theme.breakpoints.up('md')]: {
              paddingBottom: theme.spacing(2)
            }
          }
        })
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(1),
          [theme.breakpoints.up('md')]: {
            padding: theme.spacing(2)
          }
        })
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: grey['200']
        }
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          // Match the horizontal gutter of DialogContent (paddingUnit * 3 =
          // 24px) so the action buttons line up with the dialog content, and
          // add bottom breathing room. MUI defaults DialogActions to 8px,
          // which misaligns them.
          padding: `${paddingUnit}px ${paddingUnit * 3}px ${paddingUnit * 2}px`
        }
      }
    },
    // No MuiDrawer override: the app has a single Drawer (SideMenu) and its
    // width is dynamic (expanded rail vs mini rail), so it is styled at the
    // component level. A hardcoded `width` here would have to be overridden on
    // every render anyway, and would silently apply to any Drawer added later.
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: brown['500']
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: 'inherit'
        }
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          // Vertical only: keeps the breathing room between stacked fields
          // without adding a horizontal inset, which would otherwise offset
          // every field from its container gutter (breaking alignment).
          padding: '4px 0'
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          height: `${appBarHeight}px`
        },
        gutterBottom: {
          marginBottom: '0.625rem'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${brown['100']}`
        },
        head: {
          backgroundColor: brown['500'],
          color: grey['100']
        }
      }
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: `${orange['700']} !important`,
            borderRadius: '100%'
          }
        }
      }
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderWidth: '1px'
        },
        lineHorizontal: {
          borderWidth: '1px'
        },
        lineVertical: {
          borderWidth: 0,
          borderLeftWidth: '1px'
        },
        root: {
          '&.Mui-active': {
            '& .MuiStepConnector-line': {
              borderColor: brown['300'],
              borderStyle: 'dashed'
            }
          },
          '&.Mui-completed': {
            '& .MuiStepConnector-line': {
              borderColor: brown['500'],
              borderWidth: '2px'
            }
          }
        }
      }
    }
  }
};

export default createTheme(overridings);
