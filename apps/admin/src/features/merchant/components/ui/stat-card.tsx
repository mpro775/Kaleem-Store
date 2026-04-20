import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  toneColor?: string;
  toneBackground?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  toneColor = 'primary.main',
  toneBackground = 'action.hover',
}: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
        </Box>
        {icon ? (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: toneBackground,
              color: toneColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
