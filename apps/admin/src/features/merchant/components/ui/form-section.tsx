import { Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { SectionCard } from './section-card';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <SectionCard>
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          <Typography variant="h6">{title}</Typography>
          {description ? <Typography variant="body2" color="text.secondary">{description}</Typography> : null}
        </Stack>
        {children}
      </Stack>
    </SectionCard>
  );
}
