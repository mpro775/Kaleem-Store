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
    <section className="marketing-page platform-page" dir="rtl">
      <header className="marketing-header panel platform-header">
        <div className="marketing-brand-block">
          <p className="eyebrow">Kaleem Platform</p>
          <h1>الصفحة التعريفية لإدارة المنصة</h1>
          <p>
            هذه الصفحة تقدم نظرة واضحة واحترافية عن دور إدارة المنصة، مع تركيز على المحتوى
            التعريفي وتجربة هبوط كاملة بهيدر وفوتر، بدون تصميم يشبه لوحات التحكم ذات السيدبار.
          </p>
        </div>

        <nav className="marketing-nav" aria-label="روابط الصفحة التعريفية">
          <a href="#capabilities">القدرات</a>
          <a href="#workflow">آلية العمل</a>
          <a href="#contact">الخطوة التالية</a>
        </nav>

        <div className="marketing-header-actions">
          <button type="button" onClick={onBackHome}>
            الرجوع للرئيسية
          </button>
          <button className="primary" type="button" onClick={onMerchantLogin}>
            دخول التاجر
          </button>
        </div>
      </header>

      <section className="marketing-hero panel">
        <div className="marketing-hero-copy">
          <p className="eyebrow">Admin Landing</p>
          <h2>واجهة تعريفية احترافية لفريق الإدارة بدل شكل لوحة التحكم التقليدي</h2>
          <p>
            تم تصميم الصفحة لتكون مقروءة وسهلة التصفح على الجوال وسطح المكتب، وتعرض قيمة بوابة
            الإدارة بشكل تسويقي واضح قبل الانتقال إلى أي إجراءات تشغيلية.
          </p>

          <div className="trust-metrics" aria-label="مؤشرات منصة الإدارة">
            {platformMetrics.map((metric) => (
              <article key={metric.label} className="trust-metric-card">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
                <p>{metric.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="marketing-showcase" aria-label="عرض قدرات الإدارة">
          {capabilities.slice(0, 2).map((item) => (
            <article key={item.title} className="showcase-card">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </article>
          ))}
        </aside>
      </section>

      <section id="capabilities" className="marketing-section panel">
        <div className="section-heading centered">
          <p className="eyebrow">قدرات الإدارة</p>
          <h3>كل ما تحتاجه إدارة المنصة في عرض واحد واضح</h3>
        </div>

        <div className="marketing-card-grid large">
          {capabilities.map((item) => (
            <article key={item.title} className="marketing-card marketing-card-feature">
              <div className="marketing-card-icon" aria-hidden="true">
                <span />
              </div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="marketing-section panel">
        <div className="section-heading">
          <p className="eyebrow">آلية العمل</p>
          <h3>تدفق إداري مختصر من المراجعة حتى التنفيذ</h3>
        </div>

        <div className="journey-grid">
          {adminSteps.map((step) => (
            <article key={step.step} className="journey-card">
              <span className="journey-step">{step.step}</span>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="marketing-cta panel">
        <div>
          <p className="eyebrow">الانتقال السريع</p>
          <h3>اختر المسار المناسب بعد الاطلاع على الصفحة التعريفية</h3>
          <p>
            يمكنك الرجوع للصفحة الرئيسية أو الانتقال مباشرة إلى دخول التاجر. تم إبقاء التجربة
            بسيطة وبدون عناصر جانبية مشتتة.
          </p>
        </div>

        <div className="marketing-hero-actions compact">
          <button type="button" onClick={onBackHome}>
            الذهاب للرئيسية
          </button>
          <button className="primary" type="button" onClick={onMerchantLogin}>
            الانتقال إلى تسجيل الدخول
          </button>
        </div>
      </section>

      <footer className="marketing-footer panel">
        <div className="marketing-footer-brand">
          <p className="eyebrow">Kaleem Admin</p>
          <h3>صفحة تعريفية مخصصة لإدارة المنصة</h3>
          <p>هيدر واضح، محتوى منظم، وفوتر احترافي مع تجربة أخف من نمط لوحات التحكم التقليدية.</p>
        </div>

        <div className="marketing-footer-grid">
          {footerColumns.map((column) => (
            <div key={column.title} className="footer-column">
              <strong>{column.title}</strong>
              <ul>
                {column.links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="marketing-footer-actions">
          <button type="button" onClick={onBackHome}>
            الرئيسية
          </button>
          <button className="primary" type="button" onClick={onMerchantLogin}>
            دخول التاجر
          </button>
        </div>
      </footer>
    </section>
  );
}
