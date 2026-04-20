import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Switch,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { MouseEvent } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import type { MerchantSession } from '../../types';
import { ADMIN_TOKENS } from '../../../../theme/tokens';

interface MerchantTopBarProps {
  activeLabel: string;
  session: MerchantSession;
  themeMode: 'light' | 'dark';
  showNavigationToggle: boolean;
  userMenuAnchorEl: HTMLElement | null;
  onToggleThemeMode: () => void;
  onOpenNavigation: () => void;
  onOpenUserMenu: (event: MouseEvent<HTMLElement>) => void;
  onCloseUserMenu: () => void;
  onGoToStoreSettings: () => void;
  onGoToStaff: () => void;
  onSignOut: () => void;
}

export function MerchantTopBar({
  activeLabel,
  session,
  themeMode,
  showNavigationToggle,
  userMenuAnchorEl,
  onToggleThemeMode,
  onOpenNavigation,
  onOpenUserMenu,
  onCloseUserMenu,
  onGoToStoreSettings,
  onGoToStaff,
  onSignOut,
}: MerchantTopBarProps) {
  const theme = useTheme();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        zIndex: (currentTheme) => currentTheme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 64, md: ADMIN_TOKENS.heights.toolbar }, px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {showNavigationToggle ? (
            <IconButton
              color="inherit"
              aria-label="open navigation"
              edge="start"
              onClick={onOpenNavigation}
              sx={{ marginInlineEnd: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
           <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
             {activeLabel}
           </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
               px: 1,
               borderRadius: 999,
               border: '1px solid',
               borderColor: 'divider',
               bgcolor: alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.5 : 0.9),
            }}
          >
            <LightModeOutlinedIcon
              sx={{
                fontSize: 18,
                color: themeMode === 'light' ? 'warning.main' : 'text.disabled',
              }}
            />
            <Switch
              size="small"
              checked={themeMode === 'dark'}
              onChange={() => onToggleThemeMode()}
              inputProps={{ 'aria-label': 'تبديل الوضع الليلي' }}
            />
            <DarkModeOutlinedIcon
              sx={{
                fontSize: 18,
                color: themeMode === 'dark' ? 'primary.light' : 'text.disabled',
              }}
            />
          </Box>

           <IconButton size="medium" aria-label="show notifications" color="inherit">
             <NotificationsIcon />
           </IconButton>

          <Box
            onClick={onOpenUserMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
               gap: 1,
               marginInlineStart: 0.5,
               paddingBlock: 0.5,
               paddingInlineStart: 0.5,
               paddingInlineEnd: 1,
               borderRadius: 999,
               cursor: 'pointer',
               border: '1px solid',
               borderColor: 'divider',
              '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.02) },
            }}
          >
            <Avatar
              sx={{
                 width: 32,
                 height: 32,
                 bgcolor: 'primary.light',
                 color: 'primary.dark',
                 fontWeight: 700,
                 fontSize: '0.9rem',
               }}
             >
              {session.user.fullName.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {session.user.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {session.user.role === 'owner' ? 'المالك' : 'عضو فريق'}
              </Typography>
            </Box>

            <KeyboardArrowDownIcon fontSize="small" color="action" />
          </Box>

          <Menu
            anchorEl={userMenuAnchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(userMenuAnchorEl)}
            onClose={onCloseUserMenu}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1,
                minWidth: 220,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {session.user.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" dir="ltr">
                {session.user.email}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  display: 'inline-block',
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                }}
                dir="ltr"
              >
                Store ID: {session.user.storeId}
              </Typography>
            </Box>

            <Divider />

            <MenuItem onClick={onGoToStoreSettings} sx={{ direction: 'rtl' }}>
              <ListItemIcon sx={{ minWidth: 32, marginInlineEnd: 1 }}>
                <StorefrontIcon fontSize="small" />
              </ListItemIcon>
              إعدادات المتجر
            </MenuItem>

            <MenuItem onClick={onGoToStaff} sx={{ direction: 'rtl' }}>
              <ListItemIcon sx={{ minWidth: 32, marginInlineEnd: 1 }}>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              إدارة الفريق
            </MenuItem>

            <Divider />

            <MenuItem onClick={onSignOut} sx={{ color: 'error.main', direction: 'rtl' }}>
              <ListItemIcon sx={{ minWidth: 32, marginInlineEnd: 1 }}>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              تسجيل الخروج
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
