import { Box, Stack } from '@mui/material';
import type { ReactNode } from 'react';
import { ADMIN_TOKENS } from '../../../../theme/tokens';

interface AppPageProps {
  children: ReactNode;
  maxWidth?: number;
}

export function AppPage({ children, maxWidth = ADMIN_TOKENS.layout.contentMaxWidth }: AppPageProps) {
  return (
    <Box sx={{ width: '100%', maxWidth, mx: 'auto' }}>
      <Stack spacing={3}>{children}</Stack>
    </Box>
  );
}
