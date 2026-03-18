import { arSD } from '@mui/material/locale';
import { alpha, createTheme } from '@mui/material/styles';
import '@fontsource/cairo';
import '@fontsource/tajawal';

const primaryMain = '#502E91';
const primaryDark = '#4B247A';
const secondaryMain = '#7E66AC';
const accentMain = '#8F00FF';
const surfaceTint = '#F4F2FA';

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
        default: '#FAFAFF',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#333333',
        secondary: '#8589A0',
      },
      divider: '#EDE7F6',
    },
    typography: {
      fontFamily: 'Cairo, Tajawal, sans-serif',
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
        fontFamily: 'Tajawal, Cairo, sans-serif',
      },
      body2: {
        color: '#8589A0',
      },
      subtitle1: {
        fontFamily: 'Tajawal, Cairo, sans-serif',
      },
      subtitle2: {
        fontFamily: 'Tajawal, Cairo, sans-serif',
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
            backgroundColor: '#FAFAFF',
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
            background: 'linear-gradient(90deg, #6A3F9C 0%, #4B247A 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 14px 0 rgba(80, 46, 145, 0.28)',
            '&:hover': {
              background: 'linear-gradient(90deg, #5D368D 0%, #421F6E 100%)',
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
              borderColor: primaryMain,
            },
            '&.Mui-focused fieldset': {
              borderColor: primaryMain,
              boxShadow: '0 0 0 2px rgba(80, 46, 145, 0.2)',
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
            color: '#1c2f34',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 16px rgba(80, 46, 145, 0.16)',
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
            backgroundColor: accentMain,
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
