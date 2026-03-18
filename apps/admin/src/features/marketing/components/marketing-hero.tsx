import { Box, Button, Container, Stack, Typography, useTheme, alpha } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface MarketingHeroProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
}

export function MarketingHero({ onCreateAccount, onSignIn }: MarketingHeroProps) {
  const theme = useTheme();

  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 16, md: 20 },
        pb: { xs: 8, md: 12 },
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background abstract shapes - very subtle */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 70%)`,
          zIndex: 0,
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.04)} 0%, transparent 70%)`,
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
            gap: { xs: 8, md: 6 },
            alignItems: 'center',
          }}
        >
          {/* Content (Right side in RTL) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 650 }}>
            <Box>
              <Typography
                component="div"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  mb: 3,
                }}
              >
                <RocketLaunchIcon fontSize="small" />
                المنصة الأسرع نمواً للتجارة الإلكترونية
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                  lineHeight: 1.2,
                  color: 'text.primary',
                  mb: 2,
                  letterSpacing: '-1px',
                }}
              >
                أطلق متجرك الإلكتروني المتكامل في <Box component="span" sx={{ color: 'primary.main' }}>دقائق</Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  lineHeight: 1.7,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                }}
              >
                منصة كليم ستور توفر لك كل ما تحتاجه لبناء، إدارة، وتنمية تجارتك الإلكترونية بسهولة واحترافية. بدون أي خبرة تقنية.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <Button
                variant="contained"
                size="large"
                onClick={onCreateAccount}
                sx={{ px: 4, py: 1.8, fontSize: '1.1rem', borderRadius: 3 }}
              >
                ابدأ مجاناً الآن
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={onSignIn}
                sx={{ px: 4, py: 1.8, fontSize: '1.1rem', borderRadius: 3, bgcolor: 'background.paper' }}
              >
                استعرض لوحة التحكم
              </Button>
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3, mt: 2 }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <CheckCircleOutlineIcon color="success" fontSize="small" />
                 <Typography variant="body2" color="text.secondary" fontWeight={600}>
                   بدون بطاقة ائتمانية
                 </Typography>
               </Box>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <CheckCircleOutlineIcon color="success" fontSize="small" />
                 <Typography variant="body2" color="text.secondary" fontWeight={600}>
                   دعم فني متواصل
                 </Typography>
               </Box>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <CheckCircleOutlineIcon color="success" fontSize="small" />
                 <Typography variant="body2" color="text.secondary" fontWeight={600}>
                   ربط مجاني للدومين
                 </Typography>
               </Box>
            </Box>
          </Box>

          {/* Mockup / Image (Left side in RTL) */}
          <Box sx={{ position: 'relative' }}>
            {/* The Main Dashboard Mockup Card */}
            <Box
              sx={{
                position: 'relative',
                borderRadius: 4,
                bgcolor: 'background.paper',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12)',
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.8),
                overflow: 'hidden',
                aspectRatio: '16/11',
                display: 'flex',
                flexDirection: 'column',
                transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
                transition: 'transform 0.5s ease',
                '&:hover': {
                  transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
                }
              }}
            >
              {/* Browser Header */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, bgcolor: '#f8f9fa' }}>
                 <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                 <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                 <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f' }} />
                 <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: '40%', height: 14, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.05)' }} />
                 </Box>
              </Box>
              {/* Dashboard Content */}
              <Box sx={{ p: 2, flex: 1, display: 'flex', gap: 2, bgcolor: '#fafafa' }}>
                 {/* Sidebar */}
                 <Box sx={{ width: 60, display: 'flex', flexDirection: 'column', gap: 1.5, borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
                   <Box sx={{ height: 24, width: 24, borderRadius: 1, bgcolor: 'primary.main', mb: 2 }} />
                   {[1, 2, 3, 4, 5, 6].map(i => (
                     <Box key={i} sx={{ height: 10, borderRadius: 1, bgcolor: i === 1 ? 'primary.light' : 'text.disabled', opacity: i === 1 ? 0.4 : 0.2 }} />
                   ))}
                 </Box>
                 {/* Main Content Area */}
                 <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                   {/* Header */}
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ height: 16, width: 120, borderRadius: 1, bgcolor: 'text.disabled', opacity: 0.3 }} />
                      <Box sx={{ height: 24, width: 80, borderRadius: 1, bgcolor: 'primary.main', opacity: 0.9 }} />
                   </Box>
                   {/* Stats Row */}
                   <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                      {[1, 2, 3].map(i => (
                        <Box key={i} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                           <Box sx={{ height: 10, width: 40, borderRadius: 1, bgcolor: 'text.disabled', opacity: 0.3 }} />
                           <Box sx={{ height: 18, width: 60, borderRadius: 1, bgcolor: 'text.primary', opacity: 0.8 }} />
                        </Box>
                      ))}
                   </Box>
                   {/* Chart Area */}
                   <Box sx={{ flex: 1, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ height: 12, width: 100, borderRadius: 1, bgcolor: 'text.disabled', opacity: 0.3 }} />
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1, pb: 1, borderBottom: '1px dashed', borderColor: 'divider' }}>
                         {[40, 70, 45, 90, 65, 80, 55, 100, 75, 85].map((h, i) => (
                           <Box key={i} sx={{ flex: 1, height: `${h}%`, bgcolor: 'primary.main', opacity: 0.7, borderRadius: '2px 2px 0 0' }} />
                         ))}
                      </Box>
                   </Box>
                 </Box>
              </Box>
            </Box>
            
            {/* Floating Element 1 - Notification */}
            <Box
              sx={{
                position: 'absolute',
                top: 40,
                right: -30,
                bgcolor: 'background.paper',
                px: 2,
                py: 1.5,
                borderRadius: 3,
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                zIndex: 2,
              }}
            >
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.main' }}>
                <StorefrontIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>طلب جديد #1024</Typography>
                <Typography variant="caption" color="text.secondary">بواسطة أحمد - 450 ر.س</Typography>
              </Box>
            </Box>

            {/* Floating Element 2 - Growth */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 30,
                left: -30,
                bgcolor: 'background.paper',
                px: 2,
                py: 1.5,
                borderRadius: 3,
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                zIndex: 2,
              }}
            >
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                <Typography variant="subtitle2" fontWeight={800}>+24%</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>نمو المبيعات</Typography>
                <Typography variant="caption" color="text.secondary">مقارنة بالشهر الماضي</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}