import { Alert, Box } from '@mui/material';
import type { ReactNode } from 'react';
import { ADMIN_TOKENS } from '../../../../theme/tokens';

interface MerchantDashboardLayoutProps {
  bannerMessage: string;
  sidebar: ReactNode;
  topBar: ReactNode;
  mobileNavigation: ReactNode;
  children: ReactNode;
}

export function MerchantDashboardLayout({
  bannerMessage,
  sidebar,
  topBar,
  mobileNavigation,
  children,
}: MerchantDashboardLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row-reverse',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {sidebar}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {topBar}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3, xl: 4 },
            pb: { xs: 11, lg: 4, xl: 5 },
          }}
        >
          <Box
            sx={{
              maxWidth: ADMIN_TOKENS.layout.pageMaxWidth,
              mx: 'auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {bannerMessage ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {bannerMessage}
              </Alert>
            ) : null}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</Box>
          </Box>
        </Box>
      </Box>

      {mobileNavigation}
    </Box>
  );
}
