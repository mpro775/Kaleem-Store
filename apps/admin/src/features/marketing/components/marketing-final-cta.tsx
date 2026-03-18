import { Box, Button, Container, Stack, Typography, alpha, useTheme } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

interface MarketingFinalCtaProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
}

export function MarketingFinalCta({ onCreateAccount, onSignIn }: MarketingFinalCtaProps) {
  const theme = useTheme();

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 6,
            bgcolor: 'primary.dark',
            color: 'white',
            textAlign: 'center',
            py: { xs: 8, md: 10 },
            px: { xs: 3, md: 6 },
            boxShadow: '0 20px 40px rgba(75, 36, 122, 0.2)',
          }}
        >
          {/* Abstract background elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -150,
              right: -50,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.4)} 0%, transparent 70%)`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -150,
              left: -50,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.4)} 0%, transparent 70%)`,
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 700, mx: 'auto' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: alpha('#fff', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <RocketLaunchIcon fontSize="large" />
            </Box>
            <Typography variant="h2" sx={{ mb: 3, fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800 }}>
              ابدأ رحلتك التجارية مع كليم ستور اليوم
            </Typography>
            <Typography variant="h6" sx={{ mb: 5, color: alpha('#fff', 0.8), fontWeight: 400, lineHeight: 1.7 }}>
              أطلق متجرك الإلكتروني، نظم عملياتك، وقدم تجربة احترافية لعملائك من خلال منصة واحدة سهلة وقابلة للنمو.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={onCreateAccount}
                sx={{
                  px: 5,
                  py: 1.8,
                  fontSize: '1.1rem',
                  bgcolor: 'white',
                  color: 'primary.dark',
                  borderRadius: 3,
                  '&:hover': { bgcolor: alpha('#fff', 0.9) }
                }}
              >
                أنشئ متجرك مجاناً
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={onSignIn}
                sx={{
                  px: 5,
                  py: 1.8,
                  fontSize: '1.1rem',
                  color: 'white',
                  borderColor: alpha('#fff', 0.3),
                  borderRadius: 3,
                  '&:hover': { borderColor: 'white', bgcolor: alpha('#fff', 0.1) }
                }}
              >
                احجز عرضاً تجريبياً
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}