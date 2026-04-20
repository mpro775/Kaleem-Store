import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import type { MerchantNavItem, MerchantTabKey } from '../../merchant-dashboard.types';

interface MerchantMobileNavProps {
  primaryItems: MerchantNavItem[];
  activeTab: MerchantTabKey;
  onSelectTab: (tab: MerchantTabKey) => void;
  onOpenMore: () => void;
}

export function MerchantMobileNav({
  primaryItems,
  activeTab,
  onSelectTab,
  onOpenMore,
}: MerchantMobileNavProps) {
  const isPrimaryTab = primaryItems.some((item) => item.key === activeTab);
  const value = isPrimaryTab ? activeTab : 'none';

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        insetBlockEnd: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        display: { xs: 'block', lg: 'none' },
        zIndex: (theme) => theme.zIndex.appBar + 1,
      }}
    >
      <BottomNavigation
        value={value}
        showLabels
        sx={{
          height: 68,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            px: 1,
          },
        }}
        onChange={(_, nextValue: MerchantTabKey | 'more') => {
          if (nextValue === 'more') {
            onOpenMore();
            return;
          }
          onSelectTab(nextValue);
        }}
      >
        {primaryItems.map((item) => (
          <BottomNavigationAction key={item.key} value={item.key} label={item.label} icon={item.icon} />
        ))}
        <BottomNavigationAction value="more" label="المزيد" icon={<MoreHorizIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
