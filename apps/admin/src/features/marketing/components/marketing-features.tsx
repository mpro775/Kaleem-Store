import { Box, Container, Typography, Paper } from '@mui/material';
import { featureItems } from '../marketing-content';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaletteIcon from '@mui/icons-material/Palette';
import LanguageIcon from '@mui/icons-material/Language';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { alpha } from '@mui/material/styles';

const featureIcons = [
  InventoryIcon, ShoppingCartIcon, PaletteIcon, LanguageIcon,
  LocalOfferIcon, LocalShippingIcon, DashboardIcon, TrendingUpIcon
];

export function MarketingFeatures() {
  return (
    <Box component="section" id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, maxWidth: 700, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            المميزات الأساسية
          </Typography>
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            كل الأدوات التي تحتاجها لإدارة متجرك بكفاءة
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            منصة متكاملة توفر لك كل ما تحتاجه للنجاح في التجارة الإلكترونية، من إضافة المنتجات وحتى توصيل الطلبات.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
          {featureItems.map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length] ?? DashboardIcon;
            return (
              <Box key={feature.title} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    mb: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                  }}
                >
                  <Icon fontSize="medium" />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, fontSize: '1.1rem' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {feature.description}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}