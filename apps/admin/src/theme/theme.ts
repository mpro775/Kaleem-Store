import { arSD } from '@mui/material/locale';
import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';
import '@fontsource/cairo';
import '@fontsource/tajawal';
import { ADMIN_TOKENS } from './tokens';

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
  const radius = ADMIN_TOKENS.radius;
  const heights = ADMIN_TOKENS.heights;

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
          fontSize: '1.62rem',
        },
        h5: {
          fontWeight: 700,
          color: primaryDark,
        },
        h6: {
          fontWeight: 700,
        },
        button: {
          fontWeight: 700,
          fontSize: '0.92rem',
          lineHeight: 1.2,
          fontFamily: 'Tajawal, Cairo, sans-serif',
        },
        subtitle1: {
          fontWeight: 700,
          fontFamily: 'Tajawal, Cairo, sans-serif',
        },
        body2: {
          color: isDark ? '#A5ADBF' : '#8589A0',
          lineHeight: 1.6,
        },
        subtitle2: {
          fontWeight: 700,
          fontFamily: 'Tajawal, Cairo, sans-serif',
        },
      },
      shape: {
        borderRadius: radius.md,
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
              backgroundImage: isDark
                ? 'radial-gradient(circle at 15% 10%, rgba(110, 83, 184, 0.13), transparent 45%)'
                : 'radial-gradient(circle at 12% 8%, rgba(94, 65, 163, 0.06), transparent 40%)',
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
            size: 'medium',
          },
          styleOverrides: {
            root: {
              minHeight: heights.buttonMd,
              borderRadius: radius.md,
              textTransform: 'none',
              fontWeight: 700,
              paddingInline: 16,
              whiteSpace: 'nowrap',
            },
            containedPrimary: {
              background: isDark
                ? 'linear-gradient(90deg, #9E87DC 0%, #8065C9 100%)'
                : 'linear-gradient(90deg, #6A3F9C 0%, #4B247A 100%)',
              color: '#ffffff',
              boxShadow: isDark
                ? '0 6px 16px 0 rgba(112, 84, 189, 0.36)'
                : '0 5px 14px 0 rgba(80, 46, 145, 0.24)',
              '&:hover': {
                background: isDark
                  ? 'linear-gradient(90deg, #8F74D3 0%, #7459C0 100%)'
                  : 'linear-gradient(90deg, #5D368D 0%, #421F6E 100%)',
              },
            },
            outlined: {
              borderColor: alpha(primaryDark, isDark ? 0.55 : 0.18),
            },
            sizeSmall: {
              minHeight: heights.buttonSm,
              borderRadius: radius.sm,
              paddingInline: 12,
            },
            sizeLarge: {
              minHeight: heights.buttonLg,
              borderRadius: radius.md,
              paddingInline: 20,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: radius.lg,
              border: `1px solid ${isDark ? '#232C3F' : '#ECE9F5'}`,
              boxShadow: isDark
                ? '0 12px 24px rgba(4, 10, 20, 0.35), 0 4px 12px rgba(0,0,0,0.2)'
                : '0 10px 24px rgba(47, 51, 84, 0.08), 0 2px 10px rgba(0,0,0,0.04)',
              backgroundImage: 'none',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: radius.lg,
              border: `1px solid ${isDark ? '#232C3F' : '#ECE9F5'}`,
              boxShadow: isDark
                ? '0 12px 24px rgba(4, 10, 20, 0.34), 0 4px 12px rgba(0,0,0,0.2)'
                : '0 10px 24px rgba(47, 51, 84, 0.08), 0 2px 10px rgba(0,0,0,0.04)',
            },
          },
        },
        MuiOutlinedInput: {
          defaultProps: {
            size: 'small',
          },
          styleOverrides: {
            root: {
              minHeight: heights.input,
              borderRadius: radius.md,
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
              paddingTop: 10,
              paddingBottom: 10,
            },
          },
        },
        MuiTextField: {
          defaultProps: {
            variant: 'outlined',
            fullWidth: true,
            size: 'small',
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? alpha('#111726', 0.9) : alpha('#ffffff', 0.96),
              color: isDark ? '#E6EAF2' : '#1c2f34',
              backdropFilter: 'blur(12px)',
              boxShadow: isDark
                ? '0 6px 18px rgba(3, 7, 17, 0.45)'
                : '0 4px 12px rgba(80, 46, 145, 0.1)',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              border: 0,
              borderInlineStart: `1px solid ${isDark ? '#232C3F' : '#ECE9F5'}`,
              backgroundColor: isDark ? '#121825' : '#ffffff',
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            root: {
              minHeight: heights.buttonLg,
            },
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
              minHeight: heights.buttonLg,
              paddingInline: 16,
              borderRadius: radius.md,
              textTransform: 'none',
              fontWeight: 600,
              '&.Mui-selected': {
                color: primaryDark,
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              height: 28,
              fontWeight: 700,
              borderRadius: 999,
            },
          },
        },
        MuiTableContainer: {
          styleOverrides: {
            root: {
              borderRadius: radius.md,
            },
          },
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              '& .MuiTableRow-root': {
                backgroundColor: isDark ? '#1A2235' : '#F8F6FC',
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              padding: '12px 16px',
              verticalAlign: 'middle',
              borderBottomColor: isDark ? '#283248' : '#ECE9F5',
            },
            head: {
              height: heights.tableHeadRow,
              fontWeight: 700,
              color: isDark ? '#D7DEEC' : '#4B4F63',
              fontSize: '0.83rem',
            },
            body: {
              minHeight: heights.tableRow,
            },
          },
        },
        MuiToolbar: {
          styleOverrides: {
            root: {
              minHeight: heights.toolbar,
              paddingInline: 24,
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              minHeight: 40,
              borderRadius: radius.sm,
              margin: 4,
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: radius.md,
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
