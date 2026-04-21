import { Box, Typography } from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard.types';

interface AdvancedPromotionsPanelProps {
  request: MerchantRequester;
}

export function AdvancedPromotionsPanel({ request }: AdvancedPromotionsPanelProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        العروض المتقدمة
      </Typography>
      <Typography variant="body1" color="text.secondary">
        هذه الصفحة قيد التطوير.
      </Typography>
    </Box>
  );
}
