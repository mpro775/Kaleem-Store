import { useState } from 'react';
import { Box, Collapse, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Find group containing active tab to open it by default
    const initialOpenGroups: Record<string, boolean> = {
      group_dashboard: true, // Keep dashboard open by default
      group_products_inventory: true, // Keep products open by default
      group_sales_orders: true, // Keep orders open by default
    };
    
    for (const group of navItems) {
      if (group.children?.some(child => child.key === activeTab)) {
        initialOpenGroups[group.key] = true;
      }
    }
    return initialOpenGroups;
  });

  const handleToggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

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
        {navItems.map((group) => {
          const isGroupOpen = openGroups[group.key];
          const hasActiveChild = group.children?.some(child => child.key === activeTab);

          if (!group.children || group.children.length === 0) {
            // Handle as flat item just in case
            const isActive = activeTab === group.key;
            return (
              <ListItem key={group.key} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onSelectTab(group.key as MerchantTabKey)}
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
                  <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'inherit' }}>
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={group.label}
                    sx={{ textAlign: 'start' }}
                    primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }}
                  />
                </ListItemButton>
              </ListItem>
            );
          }

          return (
            <Box key={group.key} sx={{ mb: 1 }}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleToggleGroup(group.key)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    py: 0.75,
                    color: hasActiveChild && !isGroupOpen ? 'primary.main' : 'text.primary',
                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: hasActiveChild && !isGroupOpen ? 'primary.main' : 'inherit' }}>
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={group.label}
                    sx={{ textAlign: 'start' }}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                  />
                  {isGroupOpen ? <ExpandLess sx={{ opacity: 0.7 }} /> : <ExpandMore sx={{ opacity: 0.7 }} />}
                </ListItemButton>
              </ListItem>
              <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ mt: 0.5, mb: 1 }}>
                  {group.children.map((child) => {
                    const isChildActive = activeTab === child.key;
                    return (
                      <ListItemButton
                        key={child.key}
                        onClick={() => onSelectTab(child.key as MerchantTabKey)}
                        sx={{
                          borderRadius: 2,
                          minHeight: 38,
                          py: 0.5,
                          pl: 6.5,
                          pr: 2,
                          mb: 0.5,
                          bgcolor: isChildActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          color: isChildActive ? 'primary.main' : 'text.secondary',
                          '&:hover': {
                            bgcolor: isChildActive
                              ? alpha(theme.palette.primary.main, 0.15)
                              : alpha(theme.palette.text.primary, 0.04),
                            color: isChildActive ? 'primary.dark' : 'text.primary',
                          },
                        }}
                      >
                        <ListItemText
                          primary={child.label}
                          sx={{ textAlign: 'start', m: 0 }}
                          primaryTypographyProps={{
                            fontWeight: isChildActive ? 700 : 500,
                            fontSize: '0.9rem',
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
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
