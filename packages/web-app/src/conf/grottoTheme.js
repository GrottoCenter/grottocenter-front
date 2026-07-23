import { brown, blue, orange, grey } from '@mui/material/colors';
import { createTheme, alpha, responsiveFontSizes } from '@mui/material/styles';
import { isMobile } from 'react-device-detect';

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
    // Icon colour for map controls (locate, compass, data toggle). Matches
    // Leaflet's built-in control icons (zoom, layers) so every map button looks
    // uniform. Keep in sync with the CSS fallback in LocateControl.css.
    mapControlIcon: '#333333'
  },
  shape: {
    borderRadius: '4px'
  },
  typography: {
    fontFamily,
    htmlFontSize: 10,
    h1: {
      fontSize: '4.2rem'
    },
    h2: {
      fontSize: '3.5rem'
    },
    h3: {
      fontSize: '2.9rem'
    },
    h4: {
      fontSize: '2.4rem'
    },
    h5: {
      fontSize: '2rem'
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
          fontSize: '1.3rem'
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: isMobile ? paddingUnit : paddingUnit * 2
        }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: isMobile ? paddingUnit : paddingUnit * 2
        }
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
    MuiDrawer: {
      styleOverrides: {
        root: {
          width: sideMenuWidth,
          flexShrink: 0
        },
        paper: {
          top: 0,
          height: '100%',
          width: sideMenuWidth,
          display: 'flex',
          flexDirection: 'column'
        }
      }
    },
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
          marginBottom: '1rem'
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

export default responsiveFontSizes(createTheme(overridings));
