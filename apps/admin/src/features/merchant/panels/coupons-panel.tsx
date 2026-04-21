import { Box, Typography } from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard.types';

interface CouponsPanelProps {
  request: MerchantRequester;
}

export function CouponsPanel({ request }: CouponsPanelProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        الكوبونات
      </Typography>
      <Typography variant="body1" color="text.secondary">
        هذه الصفحة قيد التطوير.
      </Typography>
    </Box>
  );
}
