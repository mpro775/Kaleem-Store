import { Box, Button, Paper, Stack, Typography } from '@mui/material';

interface PlatformConsoleProps {
  onBackHome: () => void;
  onMerchantLogin: () => void;
}

const platformMetrics = [
  { value: '24/7', label: 'مراقبة تشغيلية', description: 'متابعة حالة المنصة والمتاجر والاشتراكات بشكل مستمر.' },
  { value: '99.9%', label: 'استقرار متوقع', description: 'تصميم إداري يركز على الجاهزية وتقليل الانقطاعات.' },
  { value: 'One View', label: 'صورة موحدة', description: 'لوحة تعريفية توضح ما يملكه فريق الإدارة قبل الدخول للتنفيذ.' },
];

const capabilities = [
  {
    title: 'إدارة خطط الاشتراك',
    description: 'تعريف الخطط وحدودها وتحديثها بما يتناسب مع نمو المتاجر وتنوع احتياجاتهم.',
  },
  {
    title: 'حوكمة المتاجر',
    description: 'إيقاف أو إعادة تفعيل المتاجر عند الحاجة مع سجل واضح للأسباب وإجراءات المتابعة.',
  },
  {
    title: 'متابعة النطاقات والاشتراكات',
    description: 'رؤية مركزية لحالة النطاقات والاشتراكات لتسريع الدعم واتخاذ القرار.',
  },
  {
    title: 'جاهزية للتوسع',
    description: 'هيكل إداري مرن يدعم إضافة سياسات تسعير أو صلاحيات جديدة بدون إعادة بناء كاملة.',
  },
];

const adminSteps = [
  {
    step: '01',
    title: 'تقييم الوضع العام',
    description: 'ابدأ بنظرة سريعة على مؤشرات الأداء وحالة المتاجر والاشتراكات.',
  },
  {
    step: '02',
    title: 'تنفيذ القرار الإداري',
    description: 'عدل الخطة أو حالة المتجر وفق السياسات المعتمدة ومعايير التشغيل.',
  },
  {
    step: '03',
    title: 'التحقق والمتابعة',
    description: 'راجع أثر التغيير وتأكد من استقرار التجربة للتجار والعملاء.',
  },
];

const footerColumns = [
  {
    title: 'صفحات سريعة',
    links: ['الصفحة الرئيسية', 'دخول التاجر', 'بوابة الإدارة'],
  },
  {
    title: 'محاور الإدارة',
    links: ['الخطط', 'الاشتراكات', 'المتاجر', 'النطاقات'],
  },
  {
    title: 'التركيز الحالي',
    links: ['مظهر احترافي', 'رحلة واضحة', 'بدون Sidebar', 'جاهزية للموبايل'],
  },
];

export function PlatformConsole({ onBackHome, onMerchantLogin }: PlatformConsoleProps) {
  return (
    <Box component="section" dir="rtl" sx={{ display: 'grid', gap: 1.2 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.2, md: 2 },
          borderRadius: 3,
          display: 'grid',
          gap: 1,
          gridTemplateColumns: { xs: '1fr', xl: '1.4fr auto auto' },
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
            Kaleem Platform
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.35 }}>
            الصفحة التعريفية لإدارة المنصة
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.6 }}>
            هذه الصفحة تقدم نظرة واضحة واحترافية عن دور إدارة المنصة، مع تركيز على المحتوى التعريفي
            وتجربة هبوط كاملة بهيدر وفوتر، بدون تصميم يشبه لوحات التحكم ذات السيدبار.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'row', xl: 'column' }} spacing={1}>
          <Button component="a" href="#capabilities" variant="text">القدرات</Button>
          <Button component="a" href="#workflow" variant="text">آلية العمل</Button>
          <Button component="a" href="#contact" variant="text">الخطوة التالية</Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row', xl: 'column' }} spacing={1}>
          <Button variant="outlined" onClick={onBackHome}>الرجوع للرئيسية</Button>
          <Button variant="contained" onClick={onMerchantLogin}>دخول التاجر</Button>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.2, md: 2 },
          borderRadius: 3,
          background:
            'radial-gradient(circle at top right, rgba(164, 152, 203, 0.22), transparent 35%), linear-gradient(135deg, rgba(28, 79, 79, 0.98), rgba(24, 63, 92, 0.96))',
          color: '#fff',
        }}
      >
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' } }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
              Admin Landing
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.4, color: '#fff' }}>
              واجهة تعريفية احترافية لفريق الإدارة بدل شكل لوحة التحكم التقليدي
            </Typography>
            <Typography sx={{ mt: 0.6, color: 'rgba(255,255,255,0.86)' }}>
              تم تصميم الصفحة لتكون مقروءة وسهلة التصفح على الجوال وسطح المكتب، وتعرض قيمة بوابة
              الإدارة بشكل تسويقي واضح قبل الانتقال إلى أي إجراءات تشغيلية.
            </Typography>

            <Box sx={{ mt: 1, display: 'grid', gap: 0.8, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}>
              {platformMetrics.map((metric) => (
                <Paper
                  key={metric.label}
                  sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 800 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                    {metric.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)', mt: 0.35 }}>
                    {metric.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 0.8 }}>
            {capabilities.slice(0, 2).map((item) => (
              <Paper key={item.title} sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
                <Typography variant="subtitle1">{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                  {item.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Paper>

      <Paper id="capabilities" variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 1.2 }}>
          <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
            قدرات الإدارة
          </Typography>
          <Typography variant="h5">كل ما تحتاجه إدارة المنصة في عرض واحد واضح</Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
          {capabilities.map((item) => (
            <Paper key={item.title} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
              <Typography variant="h6">{item.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {item.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Paper id="workflow" variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Box sx={{ mb: 1.2 }}>
          <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
            آلية العمل
          </Typography>
          <Typography variant="h5">تدفق إداري مختصر من المراجعة حتى التنفيذ</Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
          {adminSteps.map((step) => (
            <Paper key={step.step} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
              <Box sx={{ display: 'inline-flex', minWidth: 36, justifyContent: 'center', px: 0.75, py: 0.35, borderRadius: 99, bgcolor: 'primary.main', color: '#fff', fontWeight: 700, mb: 0.65 }}>
                {step.step}
              </Box>
              <Typography variant="h6">{step.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.45 }}>{step.description}</Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Paper id="contact" variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3, background: 'linear-gradient(135deg, #fafaff, #f3e8ff)' }}>
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1.2fr auto' }, alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
              الانتقال السريع
            </Typography>
            <Typography variant="h5">اختر المسار المناسب بعد الاطلاع على الصفحة التعريفية</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.6 }}>
              يمكنك الرجوع للصفحة الرئيسية أو الانتقال مباشرة إلى دخول التاجر. تم إبقاء التجربة بسيطة
              وبدون عناصر جانبية مشتتة.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="outlined" onClick={onBackHome}>الذهاب للرئيسية</Button>
            <Button variant="contained" onClick={onMerchantLogin}>الانتقال إلى تسجيل الدخول</Button>
          </Stack>
        </Box>
      </Paper>

      <Paper component="footer" variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3, background: 'linear-gradient(135deg, #fffaf3, #f3e7d8)' }}>
        <Box sx={{ display: 'grid', gap: 1.2, gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.3fr auto' } }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
              Kaleem Admin
            </Typography>
            <Typography variant="h5">صفحة تعريفية مخصصة لإدارة المنصة</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              هيدر واضح، محتوى منظم، وفوتر احترافي مع تجربة أخف من نمط لوحات التحكم التقليدية.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
            {footerColumns.map((column) => (
              <Box key={column.title}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{column.title}</Typography>
                <Box component="ul" sx={{ m: 0, mt: 0.8, pl: 2, display: 'grid', gap: 0.5 }}>
                  {column.links.map((link) => (
                    <Box component="li" key={link}>{link}</Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1}>
            <Button variant="outlined" onClick={onBackHome}>الرئيسية</Button>
            <Button variant="contained" onClick={onMerchantLogin}>دخول التاجر</Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
