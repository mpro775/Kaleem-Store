import { arSD } from '@mui/material/locale';
import { alpha, createTheme } from '@mui/material/styles';
import '@fontsource/cairo';

const primaryMain = '#7e66ac';
const primaryDark = '#502e91';
const secondaryMain = '#8f00ff';
const surfaceTint = '#f4f2fa';

const theme = createTheme(
  {
    direction: 'rtl',
    palette: {
      mode: 'light',
      primary: {
        main: primaryMain,
        dark: primaryDark,
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryMain,
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      text: {
        primary: '#333333',
        secondary: '#8589a0',
      },
      divider: '#e7e0f3',
    },
    typography: {
      fontFamily: 'Cairo, sans-serif',
      h1: {
        fontWeight: 800,
      },
      h2: {
        fontWeight: 800,
      },
      h3: {
        fontWeight: 800,
      },
      h4: {
        fontWeight: 800,
      },
      h5: {
        fontWeight: 800,
        color: primaryDark,
      },
      h6: {
        fontWeight: 800,
      },
      button: {
        fontWeight: 700,
      },
      body2: {
        color: '#8589a0',
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            direction: 'rtl',
          },
          body: {
            margin: 0,
            backgroundColor: '#ffffff',
            color: '#333333',
          },
          '#root': {
            minHeight: '100vh',
          },
          '*': {
            boxSizing: 'border-box',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 14,
            textTransform: 'none',
            fontWeight: 700,
          },
          containedPrimary: {
            background: 'linear-gradient(90deg, #6a3f9c 0%, #4b247a 100%)',
            color: '#ffffff',
            boxShadow: '0 3px 10px 0 rgba(76,60,170,0.10)',
            '&:hover': {
              background: 'linear-gradient(90deg, #603792 0%, #421f6d 100%)',
            },
          },
          outlined: {
            borderColor: alpha(primaryDark, 0.18),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            boxShadow: '0 15px 35px rgba(50, 50, 93, 0.13), 0 5px 15px rgba(0,0,0,0.09)',
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            boxShadow: '0 15px 35px rgba(50, 50, 93, 0.13), 0 5px 15px rgba(0,0,0,0.09)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: surfaceTint,
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#764ba2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#764ba2',
              boxShadow: '0 0 0 2px rgba(118, 75, 162, 0.1)',
            },
          },
          input: {
            paddingTop: 14,
            paddingBottom: 14,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          fullWidth: true,
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: alpha('#ffffff', 0.96),
            color: '#333333',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 16px rgba(166, 159, 216, 0.13)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 0,
            backgroundColor: '#ffffff',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: 999,
            backgroundColor: primaryDark,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            '&.Mui-selected': {
              color: primaryDark,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 999,
          },
        },
      },
    },
  },
  arSD,
);

export default theme;
