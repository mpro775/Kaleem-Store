import { Box, Container, Typography, Paper } from '@mui/material';
import { audienceItems } from '../marketing-content';

export function MarketingForWho() {
  return (
    <Box component="section" id="for-who" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, maxWidth: 700, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            لمن كليم ستور؟
          </Typography>
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            مصمم للتجار ورواد الأعمال والعلامات التجارية
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            سواء كنت تبدأ أول متجر لك أو تدير علامة تجارية تريد نمواً أكبر، المنصة مصممة لتلبية احتياجاتك.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
          {audienceItems.map((item, index) => (
            <Paper 
              key={item.title} 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 4 }, 
                borderRadius: 4, 
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 8px 24px rgba(80, 46, 145, 0.08)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  color: 'divider', 
                  fontWeight: 900, 
                  opacity: 0.5,
                  fontSize: '4rem',
                  lineHeight: 0.8
                }}
              >
                0{index + 1}
              </Typography>
              <Box>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 800 }}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {item.description}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}