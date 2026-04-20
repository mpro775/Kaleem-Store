import { Box, Paper } from '@mui/material';
import type { ReactNode } from 'react';

interface DataTableWrapperProps {
  children: ReactNode;
}

export function DataTableWrapper({ children }: DataTableWrapperProps) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>{children}</Box>
    </Paper>
  );
}
