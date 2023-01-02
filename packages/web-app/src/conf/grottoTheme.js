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

const sideMenuWidth = '215px';
const appBarHeight = '56px';
const breadcrumpHeight = 24;
const paddingUnit = 8;

export const overridings = {
  name: 'Main theme',
  spacing: [
    paddingUnit / 4,
    paddingUnit / 2,
    paddingUnit,
    paddingUnit * 2,
    paddingUnit * 3,
    paddingUnit * 4,
    paddingUnit * 8
  ],
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
    backgroundColor: grey['100'],
    contrastThreshold: 3,
    primary1Color: brown['500'],
    primary2Color: brown['700'],
    primary3Color: brown['100'],
    secondary1Color: blue['500'],
    secondary2Color: blue['700'],
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
    errorColor: '#ff2020',
    successColor: '#49dd3b'
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
  // https://material-ui.com/customization/globals/#default-props
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
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: brown['500'],
          color: '#fff'
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
    MuiDrawer: {
      styleOverrides: {
        root: {
          width: sideMenuWidth,
          flexShrink: 0
        },
        paper: {
          top: appBarHeight,
          height: `calc(100% - ${appBarHeight})`,
          width: sideMenuWidth,
          padding: '8px'
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
      defaultProps: {
        variant: 'filled'
      },
      styleOverrides: {
        root: {
          padding: '4px'
        }
      }
    },
    MuiSelect: {
      defaultProps: {
        variant: 'filled'
      },
      styleOverrides: {
        root: {
          fontFamily
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          height: `${appBarHeight}`
        }
      },
      gutterBottom: {
        marginBottom: '1rem'
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          display: 'flex'
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
        root: {
          '&.Mui-active': {
            '& $line': {
              borderColor: '#a1887f',
              borderStyle: 'dashed'
            }
          },
          '&.Mui-completed': {
            '& $line': {
              borderColor: brown['500'],
              borderWidth: '2px'
            }
          }
        },
        line: {
          borderWidth: '1px'
        },
        lineHorizontal: {
          borderWidth: '1px'
        },
        lineVertical: {
          borderWidth: 0,
          borderLeftWidth: '1px'
        }
      }
    }
  }
};

export default responsiveFontSizes(createTheme(overridings));
