import { Box, Button, Container, Stack, Typography, Divider, IconButton } from '@mui/material';
import { footerLinks } from '../marketing-content';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';

interface MarketingFooterProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
}

export function MarketingFooter({ onCreateAccount, onSignIn }: MarketingFooterProps) {
  return (
    <Box component="footer" sx={{ pt: 10, pb: 4, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 3fr' }, gap: 8, mb: 8 }}>
          {/* Brand Info */}
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                }}
              >
                K
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px', mb: 0 }}>
                كليم ستور
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 350, lineHeight: 1.7 }}>
              منصة متكاملة للتجارة الإلكترونية تساعد العلامات التجارية العربية على إطلاق وإدارة متاجرها باحترافية وسهولة تامة.
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <TwitterIcon />
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <LinkedInIcon />
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                <InstagramIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Links Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 4 }}>
            {footerLinks.map((column) => (
              <Box key={column.title}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                  {column.title}
                </Typography>
                <Stack spacing={1.5}>
                  {column.links.map((link) => (
                    <Typography 
                      key={link} 
                      component="a" 
                      href="#" 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        textDecoration: 'none', 
                        transition: 'color 0.2s',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {link}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Bottom Bar */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            جميع الحقوق محفوظة © {new Date().getFullYear()} كليم ستور
          </Typography>
          <Stack direction="row" spacing={3}>
            <Typography component="a" href="#" variant="body2" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>
              شروط الاستخدام
            </Typography>
            <Typography component="a" href="#" variant="body2" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>
              سياسة الخصوصية
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}