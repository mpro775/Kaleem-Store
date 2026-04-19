import { arSD } from '@mui/material/locale';
import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';
import '@fontsource/cairo';
import '@fontsource/tajawal';

const lightPrimaryMain = '#502E91';
const lightPrimaryDark = '#4B247A';
const darkPrimaryMain = '#9E87DC';
const darkPrimaryDark = '#8065C9';
const secondaryMain = '#7E66AC';
const accentMain = '#8F00FF';

export function createAdminTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const primaryMain = isDark ? darkPrimaryMain : lightPrimaryMain;
  const primaryDark = isDark ? darkPrimaryDark : lightPrimaryDark;
  const surfaceTint = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F4F2FA';

  return createTheme(
    {
      direction: 'rtl',
      palette: {
        mode,
        primary: {
          main: primaryMain,
          dark: primaryDark,
          contrastText: '#ffffff',
        },
        secondary: {
          main: secondaryMain,
        },
        background: {
          default: isDark ? '#0E1118' : '#FAFAFF',
          paper: isDark ? '#171C27' : '#FFFFFF',
        },
        text: {
          primary: isDark ? '#E6EAF2' : '#333333',
          secondary: isDark ? '#A5ADBF' : '#8589A0',
        },
        divider: isDark ? '#2A3245' : '#EDE7F6',
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
          color: isDark ? '#A5ADBF' : '#8589A0',
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
              backgroundColor: isDark ? '#0E1118' : '#FAFAFF',
              color: isDark ? '#E6EAF2' : '#333333',
              transition: 'background-color 180ms ease, color 180ms ease',
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
              background: isDark
                ? 'linear-gradient(90deg, #9E87DC 0%, #8065C9 100%)'
                : 'linear-gradient(90deg, #6A3F9C 0%, #4B247A 100%)',
              color: '#ffffff',
              boxShadow: isDark
                ? '0 6px 18px 0 rgba(112, 84, 189, 0.4)'
                : '0 4px 14px 0 rgba(80, 46, 145, 0.28)',
              '&:hover': {
                background: isDark
                  ? 'linear-gradient(90deg, #8F74D3 0%, #7459C0 100%)'
                  : 'linear-gradient(90deg, #5D368D 0%, #421F6E 100%)',
              },
            },
            outlined: {
              borderColor: alpha(primaryDark, isDark ? 0.55 : 0.18),
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 24,
              boxShadow: isDark
                ? '0 18px 34px rgba(5, 8, 20, 0.45), 0 8px 18px rgba(0,0,0,0.32)'
                : '0 15px 35px rgba(50, 50, 93, 0.13), 0 5px 15px rgba(0,0,0,0.09)',
              backgroundImage: 'none',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 24,
              boxShadow: isDark
                ? '0 16px 30px rgba(5, 8, 20, 0.4), 0 6px 14px rgba(0,0,0,0.28)'
                : '0 15px 35px rgba(50, 50, 93, 0.13), 0 5px 15px rgba(0,0,0,0.09)',
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              backgroundColor: surfaceTint,
              '& fieldset': {
                borderColor: isDark ? '#303A50' : '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: primaryMain,
              },
              '&.Mui-focused fieldset': {
                borderColor: primaryMain,
                boxShadow: `0 0 0 2px ${alpha(primaryMain, isDark ? 0.36 : 0.2)}`,
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
              backgroundColor: isDark ? alpha('#111726', 0.9) : alpha('#ffffff', 0.96),
              color: isDark ? '#E6EAF2' : '#1c2f34',
              backdropFilter: 'blur(12px)',
              boxShadow: isDark
                ? '0 8px 24px rgba(3, 7, 17, 0.5)'
                : '0 4px 16px rgba(80, 46, 145, 0.16)',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              border: 0,
              backgroundColor: isDark ? '#121825' : '#ffffff',
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
}

const theme = createAdminTheme('light');

export default theme;
