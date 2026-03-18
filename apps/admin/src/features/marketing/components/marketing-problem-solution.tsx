import { Box, Container, Typography, Paper } from '@mui/material';
import { problemItems, solutionItems } from '../marketing-content';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { alpha } from '@mui/material/styles';

export function MarketingProblemSolution() {
  return (
    <Box component="section" id="problem" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, maxWidth: 700, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            الحل المتكامل
          </Typography>
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            كل ما يحتاجه التاجر الرقمي في منصة واحدة
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 5 }, 
              borderRadius: 4, 
              bgcolor: alpha('#ef5350', 0.03),
              border: '1px solid',
              borderColor: alpha('#ef5350', 0.1),
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha('#ef5350', 0.1), color: '#ef5350', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CancelOutlinedIcon />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                الطريقة التقليدية
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {problemItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef5350', mt: 1.2, flexShrink: 0 }} />
                  <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 5 }, 
              borderRadius: 4, 
              bgcolor: alpha('#4caf50', 0.03),
              border: '1px solid',
              borderColor: alpha('#4caf50', 0.1),
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha('#4caf50', 0.1), color: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlineIcon />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                الحل مع كليم ستور
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {solutionItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4caf50', mt: 1.2, flexShrink: 0 }} />
                  <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}