import { Box, Container, Typography, Paper, Button, Stack } from '@mui/material';
import { pricingPlans } from '../marketing-content';
import CheckIcon from '@mui/icons-material/Check';

export function MarketingPricing() {
  return (
    <Box component="section" id="pricing" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, maxWidth: 700, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            الأسعار والخطط
          </Typography>
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            خطط تناسب حجم نشاطك
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            أسعار شفافة وبدون رسوم خفية. ابدأ مجاناً وقم بالترقية عندما ينمو متجرك.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, alignItems: 'center' }}>
          {pricingPlans.map((plan, index) => {
            const isPopular = index === 1; // Middle plan is popular
            return (
              <Paper
                key={plan.name}
                elevation={isPopular ? 12 : 0}
                variant={isPopular ? 'elevation' : 'outlined'}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  position: 'relative',
                  border: isPopular ? '2px solid' : '1px solid',
                  borderColor: isPopular ? 'primary.main' : 'divider',
                  transform: isPopular ? { md: 'scale(1.05)' } : 'none',
                  zIndex: isPopular ? 2 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {isPopular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: 0.5,
                    }}
                  >
                    الأكثر شيوعاً
                  </Box>
                )}
                
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
                  {plan.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                  {plan.description}
                </Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h3" component="span" sx={{ fontWeight: 800 }}>
                    {index === 0 ? 'مجاناً' : index === 1 ? '99' : '199'}
                  </Typography>
                  {index !== 0 && (
                    <Typography variant="body1" component="span" color="text.secondary" sx={{ ml: 1 }}>
                      ر.س / شهرياً
                    </Typography>
                  )}
                </Box>

                <Button
                  variant={isPopular ? 'contained' : 'outlined'}
                  size="large"
                  fullWidth
                  sx={{ mb: 4, borderRadius: 2, py: 1.5 }}
                >
                  {index === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
                </Button>

                <Stack spacing={2} sx={{ mt: 'auto' }}>
                  {plan.items.map((item) => (
                    <Box key={item} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <CheckIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.3 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}