import { Box, Container, Typography, Paper } from '@mui/material';
import { domainPoints } from '../marketing-content';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export function MarketingDomain() {
  return (
    <Box component="section" id="domain" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 6, md: 8 }, alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
              الدومين المخصص
            </Typography>
            <Typography variant="h2" sx={{ mb: 3, fontSize: { xs: '2rem', md: '2.5rem' } }}>
              شغّل متجرك على نطاقك الخاص
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 4, lineHeight: 1.7 }}>
              اربط متجرك بدومين مخصص (مثل www.yourbrand.com) ليظهر باسم علامتك التجارية ويمنح عملائك ثقة أعلى واحترافية أكبر.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {domainPoints.map((point) => (
                <Box key={point} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color="primary" fontSize="small" />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {point}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Paper 
              elevation={24}
              sx={{ 
                p: 4, 
                borderRadius: 4, 
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
                width: '100%',
                maxWidth: 400
              }}
            >
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, opacity: 0.8 }}>
                <LanguageIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                إعداد سهل وسريع
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                لا يتطلب خبرة تقنية، بضع نقرات ويكون النطاق جاهزاً للعمل.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ color: 'text.secondary', fontFamily: 'monospace', flex: 1, textAlign: 'left' }} dir="ltr">
                  https://www.yourbrand.com
                </Typography>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}