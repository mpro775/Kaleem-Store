import { Box, Container, Typography, Paper } from '@mui/material';
import { themePresets } from '../marketing-content';
import ColorLensIcon from '@mui/icons-material/ColorLens';

export function MarketingThemes() {
  return (
    <Box component="section" id="themes" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, maxWidth: 700, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            القوالب والتصميم
          </Typography>
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            متجر يعكس هويتك، وليس مجرد صفحة بيع
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            قوالب جاهزة واحترافية مع تخصيص مرن للألوان والمحتوى والأقسام لتناسب علامتك التجارية.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
          {themePresets.map((preset, index) => (
            <Paper 
              key={preset.name} 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 4 }, 
                borderRadius: 4, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: index === 0 ? '#f0e6ff' : index === 1 ? '#e6f7ff' : '#fff0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: index === 0 ? '#6A3F9C' : index === 1 ? '#0070f3' : '#f5a623' }}>
                  <ColorLensIcon />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {preset.name}
                </Typography>
              </Box>

              <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {preset.details.map((detail) => (
                  <Box component="li" key={detail} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                      {detail}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}