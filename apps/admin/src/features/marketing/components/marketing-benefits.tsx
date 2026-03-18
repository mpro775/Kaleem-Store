import { Box, Container, Typography, Paper } from '@mui/material';
import { businessBenefits } from '../marketing-content';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { alpha } from '@mui/material/styles';

export function MarketingBenefits() {
  return (
    <Box component="section" id="benefits" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, maxWidth: 700, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            لماذا كليم ستور؟
          </Typography>
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            صمم خصيصاً لنمو تجارتك
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            اكتشف المزايا التي تجعل منصتنا الخيار الأول للتجار الطموحين.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
          {businessBenefits.map((item, index) => (
            <Paper 
              key={item} 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha('#502E91', 0.02)
                }
              }}
            >
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: alpha('#502E91', 0.08), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUpIcon fontSize="small" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                {item}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}