import { Box, Paper, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  dense?: boolean;
  sx?: SxProps<Theme>;
}

export function SectionCard({ title, subtitle, actions, children, dense = false, sx }: SectionCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: dense ? 2 : { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
    >
      {title ? (
        <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Stack spacing={0.5}>
            <Typography variant="h6">{title}</Typography>
            {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
          </Stack>
          {actions}
        </Box>
      ) : null}
      {children}
    </Paper>
  );
}
