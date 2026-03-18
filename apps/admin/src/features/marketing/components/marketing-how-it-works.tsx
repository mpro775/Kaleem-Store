import { Box, Container, Typography, Paper } from '@mui/material';
import { howItWorksSteps } from '../marketing-content';
import { alpha } from '@mui/material/styles';

export function MarketingHowItWorks() {
  return (
    <Box component="section" id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 10 }, maxWidth: 700, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            خطوات العمل
          </Typography>
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            ابدأ متجرك في خطوات بسيطة
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            لا حاجة للتعقيد، صممنا العملية لتكون سلسة وسريعة لتبدأ البيع في أسرع وقت.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative' }}>
          {/* Connecting Line */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'absolute',
              top: 36,
              left: 0,
              right: 0,
              height: 2,
              bgcolor: 'divider',
              zIndex: 0,
            }}
          />

          <Box sx={{ display: 'grid', gap: { xs: 4, md: 2 }, gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' } }}>
            {howItWorksSteps.map((step, index) => (
              <Box key={step.step} sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: index === 0 ? 'primary.main' : 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    boxShadow: index === 0 ? `0 0 0 4px ${(theme: any) => alpha(theme.palette.primary.main, 0.1)}` : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, color: index === 0 ? 'primary.main' : 'text.secondary' }}>
                    {step.step}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, fontSize: '1.1rem' }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 2, md: 0 }, lineHeight: 1.6 }}>
                  {step.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}