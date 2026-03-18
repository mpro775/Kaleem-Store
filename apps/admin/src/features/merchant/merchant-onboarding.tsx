import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type { MerchantSession } from './types';

interface MerchantOnboardingProps {
  session: MerchantSession;
  onContinue: () => void;
  onSignedOut: () => void;
}

const setupSteps = [
  {
    title: 'راجع إعدادات المتجر',
    description: 'ابدأ باسم المتجر، العملة، وسائل التواصل، والسياسات الأساسية قبل إطلاق الواجهة العامة.',
  },
  {
    title: 'أضف أول منتج',
    description: 'أنشئ المنتجات والتصنيفات والمخزون حتى تصبح واجهة المتجر جاهزة للمعاينة والبيع.',
  },
  {
    title: 'جهز تجربة البيع',
    description: 'راجع الشحن، الدفع، والثيمات ثم انتقل لاحقاً إلى معاينة المتجر العام بثقة.',
  },
];

export function MerchantOnboarding({ session, onContinue, onSignedOut }: MerchantOnboardingProps) {
  return (
    <Paper variant="outlined" dir="rtl" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3, display: 'grid', gap: 1.2 }}>
      <Box>
        <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
          أهلاً بك في لوحة التاجر
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.4 }}>
          تم إنشاء حسابك بنجاح يا {session.user.fullName}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.7 }}>
          الخطوة التالية هي تجهيز متجرك بسرعة قبل الدخول إلى جميع أقسام لوحة التحكم. هذا onboarding
          خفيف حتى يوضح للتاجر أولويات البداية بدون إرباك.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
        {[
          { label: 'البريد', value: session.user.email },
          { label: 'المتجر', value: session.user.storeId },
          { label: 'الدور', value: session.user.role },
        ].map((item) => (
          <Paper key={item.label} variant="outlined" sx={{ p: 1.1, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {item.label}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.35, wordBreak: 'break-word' }}>
              {item.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
        {setupSteps.map((step, index) => (
          <Paper key={step.title} variant="outlined" sx={{ p: 1.1, borderRadius: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                minWidth: 36,
                justifyContent: 'center',
                px: 0.7,
                py: 0.35,
                borderRadius: 99,
                bgcolor: 'primary.main',
                color: '#fff',
                fontWeight: 700,
                mb: 0.7,
              }}
            >
              {`0${index + 1}`}
            </Box>
            <Typography variant="h6">{step.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45 }}>
              {step.description}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
          الخطوة التالية
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.35 }}>
          هل تريد الدخول الآن إلى لوحة التاجر؟
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.6 }}>
          عند المتابعة ستدخل إلى `/merchant` بكامل الأقسام. ويمكنك لاحقاً إضافة المنتجات وضبط الشحن
          والثيمات ثم معاينة المتجر العام.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
          <Button variant="contained" onClick={onContinue}>
            ابدأ إعداد المتجر
          </Button>
          <Button variant="outlined" onClick={onSignedOut}>
            تسجيل الخروج
          </Button>
        </Stack>
      </Paper>
    </Paper>
  );
}
