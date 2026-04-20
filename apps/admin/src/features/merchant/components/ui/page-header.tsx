import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        minHeight: 92,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="h4">{title}</Typography>
        {description ? <Typography color="text.secondary">{description}</Typography> : null}
      </Stack>
      {actions ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>{actions}</Box> : null}
    </Box>
  );
}
