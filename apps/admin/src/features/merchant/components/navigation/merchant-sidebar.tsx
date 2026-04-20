import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { MerchantNavItem, MerchantTabKey } from '../../merchant-dashboard.types';

interface MerchantSidebarProps {
  drawerWidth: number;
  navItems: MerchantNavItem[];
  activeTab: MerchantTabKey;
  isDesktop: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectTab: (tab: MerchantTabKey) => void;
}

export function MerchantSidebar({
  drawerWidth,
  navItems,
  activeTab,
  isDesktop,
  mobileOpen,
  onCloseMobile,
  onSelectTab,
}: MerchantSidebarProps) {
  const theme = useTheme();

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: 2,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.2rem',
          }}
        >
          K
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
          كليم ستور
        </Typography>
      </Box>

      <List sx={{ flex: 1, px: 1.5, py: 2, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onSelectTab(item.key)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  py: 0.75,
                  bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.text.primary, 0.04),
                    color: isActive ? 'primary.dark' : 'text.primary',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{ textAlign: 'start' }}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Paper
          elevation={0}
          sx={{ p: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
            حالة متجرك الآن
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              متصل ونشط
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: { xs: 'none', lg: 'block' }, width: drawerWidth, flexShrink: 0 }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            borderInlineStart: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {content}
        </Box>
      </Box>

      <Drawer
        anchor="right"
        variant="temporary"
        open={!isDesktop && mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderInlineStart: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}
