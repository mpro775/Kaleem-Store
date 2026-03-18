import { Box, Button, Paper, Typography, Container, Stack, alpha, useTheme } from '@mui/material';
import { MerchantLogin } from '../merchant/merchant-login';
import type { MerchantSession } from '../merchant/types';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface MerchantLoginPageProps {
  onLoggedIn: (session: MerchantSession) => void;
  onBackHome: () => void;
  onCreateAccount: () => void;
}

export function MerchantLoginPage({
  onLoggedIn,
  onBackHome,
  onCreateAccount,
}: MerchantLoginPageProps) {
  const theme = useTheme();

  return (
    <Box
      component="section"
      dir="rtl"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, width: '100%' }}>
        
        {/* Right Form Side */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', p: { xs: 3, sm: 6, md: 8, lg: 12 }, position: 'relative' }}>
          
          <Button 
            onClick={onBackHome}
            sx={{ position: 'absolute', top: 32, right: 32, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            startIcon={<ArrowForwardIcon sx={{ mr: -1, ml: 1 }} />}
          >
            العودة للرئيسية
          </Button>

          <Box sx={{ maxWidth: 420, width: '100%', mx: 'auto' }}>
            <Box sx={{ mb: 5, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                K
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                تسجيل الدخول
              </Typography>
              <Typography color="text.secondary">
                مرحباً بعودتك! الرجاء إدخال بيانات الدخول الخاصة بك
              </Typography>
            </Box>

            <MerchantLogin onLoggedIn={onLoggedIn} />

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                ليس لديك حساب؟{' '}
                <Typography
                  component="span"
                  color="primary"
                  sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={onCreateAccount}
                >
                  أنشئ متجرك مجاناً
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Left Branding Side (Hidden on Mobile) */}
        <Box 
          sx={{ 
            display: { xs: 'none', lg: 'flex' },
            bgcolor: 'primary.main',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 8
          }}
        >
          {/* Abstract Background */}
          <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.6)} 0%, transparent 70%)` }} />
          <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.4)} 0%, transparent 70%)` }} />
          
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480, mx: 'auto' }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, fontSize: '3rem', lineHeight: 1.2 }}>
              أدر تجارتك بكفاءة واحترافية عالية.
            </Typography>
            <Typography variant="h6" sx={{ color: alpha('#fff', 0.8), mb: 6, fontWeight: 400, lineHeight: 1.6 }}>
              كليم ستور يقدم لك لوحة تحكم متكاملة تضع كل أدوات التجارة الإلكترونية بين يديك.
            </Typography>

            <Stack spacing={3}>
              {[
                'إدارة سهلة للمنتجات والطلبات والعملاء.',
                'تقارير وتحليلات دقيقة لأداء متجرك.',
                'إعدادات مرنة لتخصيص مظهر المتجر وربط الدومين.'
              ].map((text, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleOutlineIcon sx={{ color: 'secondary.light' }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ position: 'absolute', bottom: 40, left: 40, right: 40 }}>
             <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha('#fff', 0.1), backdropFilter: 'blur(10px)', border: `1px solid ${alpha('#fff', 0.2)}`, color: 'white' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2 }}>
                  "منذ انتقالي إلى كليم ستور، أصبحت إدارة طلباتي اليومية أسهل بكثير واستطعت التركيز على زيادة مبيعاتي بدلاً من المشاكل التقنية."
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    م
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>محمد الراجحي</Typography>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>مالك متجر تقنية</Typography>
                  </Box>
                </Stack>
             </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}