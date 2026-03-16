interface MarketingHomeProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
}

const trustMetrics = [
  { value: '01', label: 'مسار موحد', description: 'التاجر يبدأ من الصفحة التعريفية ثم التسجيل ثم اللوحة.' },
  { value: '06+', label: 'مجالات تشغيل', description: 'منتجات، طلبات، شحن، دفع، فريق، تخصيص المتجر.' },
  { value: 'RTL', label: 'واجهة عربية', description: 'هوية واضحة وسريعة تناسب رحلة التاجر العربي.' },
];

const featureCards = [
  {
    title: 'إدارة تشغيل كاملة',
    description: 'من لوحة واحدة تدير المنتجات والمخزون والطلبات والشحن والدفع بدون التنقل بين تطبيقات مشتتة.',
  },
  {
    title: 'بداية سريعة للتاجر',
    description: 'الصفحة التعريفية تقود مباشرة إلى إنشاء الحساب ثم الدخول إلى لوحة التاجر في نفس التطبيق.',
  },
  {
    title: 'مرونة للتوسع لاحقاً',
    description: 'الثيمات والدومينات والويب هوكس والفريق كلها جزء من مسار نمو المتجر وليس إضافات منفصلة.',
  },
  {
    title: 'فصل واضح بين الأدوار',
    description: 'بوابة التاجر موجودة داخل admin، بينما storefront يبقى فقط للعميل والمعاينة والواجهة العامة.',
  },
  {
    title: 'تجربة عمل مفهومة',
    description: 'كل خطوة في الرحلة لها هدف واضح: تعريف، تسجيل، دخول، تشغيل، ثم معاينة المتجر.',
  },
  {
    title: 'جاهزية لرحلة onboarding',
    description: 'الهيكل الحالي يسهّل لاحقاً إضافة خطوات إعداد أولية بعد التسجيل ورفع التحويل.',
  },
];

const journeySteps = [
  {
    step: '01',
    title: 'أنشئ الحساب',
    description: 'يدخل التاجر إلى الصفحة الرئيسية، يقرأ القيمة بسرعة، ثم يضغط زر إنشاء الحساب من الهيدر أو الـ hero.',
  },
  {
    step: '02',
    title: 'ادخل إلى لوحة التاجر',
    description: 'بعد التسجيل أو تسجيل الدخول ينتقل مباشرة إلى `/merchant` ليبدأ إعداد المتجر وإضافة البيانات الأساسية.',
  },
  {
    step: '03',
    title: 'جهز متجرك للعرض',
    description: 'بعد ضبط المنتجات والشحن والثيم يصبح المتجر جاهزاً للمعاينة على storefront بدون خلط رحلة العميل برحلة التاجر.',
  },
];

const workspaceCards = [
  {
    title: 'لوحة تشغيل التاجر',
    points: ['إعدادات المتجر', 'المنتجات والمخزون', 'الطلبات والشحن', 'إدارة الفريق'],
  },
  {
    title: 'مظهر المتجر والعرض',
    points: ['الثيمات والأقسام', 'الدومينات المخصصة', 'معاينة الواجهة العامة', 'تجهيز المتجر قبل الإطلاق'],
  },
  {
    title: 'تشغيل ونمو',
    points: ['المدفوعات', 'العروض الترويجية', 'الويب هوكس', 'الربط مع خطوات لاحقة للـ onboarding'],
  },
];

const plans = [
  {
    name: 'ابدأ الآن',
    badge: 'الأسرع',
    description: 'للتاجر الذي يريد إنشاء متجره وتجهيز تشغيله الأساسي بسرعة.',
    items: ['إنشاء حساب سريع', 'لوحة تاجر موحدة', 'تخصيص أولي للمتجر', 'جاهزية للمعاينة قبل النشر'],
  },
  {
    name: 'جاهزية تشغيل',
    badge: 'الأوضح',
    description: 'للتاجر الذي يريد مساراً متكاملاً من التسجيل حتى إدارة المتجر دون أي تشتت.',
    items: ['دخول مباشر للوحة', 'تنظيم المجالات التشغيلية', 'رحلة واضحة للمستخدم', 'قابلية توسعة لاحقة'],
  },
];

const faqItems = [
  {
    question: 'من أين يبدأ التاجر؟',
    answer: 'يبدأ من الصفحة التعريفية داخل admin، ثم ينتقل مباشرة إلى إنشاء الحساب أو تسجيل الدخول.',
  },
  {
    question: 'هل المتجر العام هو نفسه بوابة التاجر؟',
    answer: 'لا. بوابة التاجر داخل admin فقط، أما storefront فهو واجهة العميل والمعاينة.',
  },
  {
    question: 'هل يمكن للتاجر الوصول السريع إلى لوحة التحكم؟',
    answer: 'نعم، زر تسجيل الدخول ظاهر في الهيدر وفي أكثر من نقطة داخل الصفحة لتقليل أي احتكاك.',
  },
  {
    question: 'ماذا يحدث بعد إنشاء الحساب؟',
    answer: 'المرحلة التالية ستربط التسجيل الفعلي مع الـ API ثم تنقل التاجر مباشرة إلى لوحة التحكم.',
  },
];

const footerColumns = [
  {
    title: 'المنتج',
    links: ['المزايا', 'كيف يعمل', 'الواجهة', 'الأسئلة الشائعة'],
  },
  {
    title: 'المسارات',
    links: ['الصفحة الرئيسية', 'إنشاء حساب', 'تسجيل الدخول', 'لوحة التاجر'],
  },
  {
    title: 'التركيز الحالي',
    links: ['تقليل التشتت', 'رفع التحويل', 'رحلة تاجر واضحة', 'ربط سلس مع لوحة التحكم'],
  },
];

export function MarketingHome({ onCreateAccount, onSignIn }: MarketingHomeProps) {
  return (
    <section className="marketing-page" dir="rtl">
      <header className="marketing-header panel">
        <div className="marketing-brand-block">
          <p className="eyebrow">Kaleem Store</p>
          <h1>بوابة التاجر التي تختصر الطريق من الفكرة إلى تشغيل المتجر</h1>
          <p>
            صممنا هذه الصفحة لتكون بداية واضحة وسريعة: يتعرف التاجر على القيمة، ثم ينتقل مباشرة
            إلى إنشاء الحساب أو تسجيل الدخول، وبعدها إلى لوحة التشغيل بدون أي خلط مع واجهة العميل.
          </p>
        </div>

        <nav className="marketing-nav" aria-label="روابط الصفحة التعريفية">
          <a href="#features">المزايا</a>
          <a href="#journey">كيف يعمل</a>
          <a href="#workspace">الواجهة</a>
          <a href="#plans">الجاهزية</a>
          <a href="#faq">الأسئلة</a>
        </nav>

        <div className="marketing-header-actions">
          <button type="button" onClick={onSignIn}>
            تسجيل الدخول
          </button>
          <button className="primary" type="button" onClick={onCreateAccount}>
            إنشاء حساب
          </button>
        </div>
      </header>

      <section className="marketing-hero panel">
        <div className="marketing-hero-copy">
          <p className="eyebrow">للتاجر العربي</p>
          <h2>ابدأ من صفحة تعريفية احترافية ثم انتقل فوراً إلى حسابك ولوحة متجرك</h2>
          <p>
            بدلاً من تشتيت التاجر بين عدة تطبيقات، أصبح `admin` هو نقطة الدخول الرسمية: تعريف،
            تسجيل، دخول، تشغيل. أما `storefront` فيبقى فقط لواجهة العميل والمعاينة العامة.
          </p>

          <div className="marketing-hero-actions">
            <button className="primary" type="button" onClick={onCreateAccount}>
              ابدأ الآن
            </button>
            <button type="button" onClick={onSignIn}>
              لدي حساب بالفعل
            </button>
          </div>

          <div className="trust-metrics" aria-label="مؤشرات الثقة">
            {trustMetrics.map((metric) => (
              <article key={metric.label} className="trust-metric-card">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
                <p>{metric.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="marketing-console-preview" aria-label="معاينة رحلة التاجر">
          <div className="console-window">
            <div className="console-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="console-body">
              <div className="console-sidebar">
                <strong>Kaleem Admin</strong>
                <ul>
                  <li>الصفحة الرئيسية</li>
                  <li>إنشاء حساب</li>
                  <li>تسجيل الدخول</li>
                  <li>لوحة التاجر</li>
                </ul>
              </div>
              <div className="console-main">
                <div className="console-panel console-panel-hero">
                  <strong>رحلة واضحة</strong>
                  <p>واجهة تعريفية تقود إلى CTA مباشر ثم إلى لوحة التاجر.</p>
                </div>
                <div className="console-grid">
                  <div className="console-panel">
                    <strong>إعدادات المتجر</strong>
                    <p>الاسم، الهوية، السياسات، الشحن.</p>
                  </div>
                  <div className="console-panel">
                    <strong>تشغيل يومي</strong>
                    <p>منتجات، طلبات، مخزون، فريق.</p>
                  </div>
                  <div className="console-panel">
                    <strong>المعاينة</strong>
                    <p>رابط المتجر العام يظل منفصلاً وواضحاً.</p>
                  </div>
                  <div className="console-panel accent">
                  <strong>دعوة للإجراء</strong>
                    <p>إنشاء حساب ظاهر دائماً في الصفحة.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="marketing-band panel">
        <div>
          <p className="eyebrow">الهدف من المرحلة الثانية</p>
          <h3>واجهة تعريفية ناضجة بصرياً ومركزة على التحويل</h3>
        </div>
        <p>
          الصفحة الآن ليست مجرد placeholder؛ بل أصبحت واجهة تسويقية كاملة فيها هيدر، أقسام،
          دعوات واضحة لاتخاذ الإجراء، وفوتر منظم يقود التاجر إلى إنشاء الحساب بأسرع وقت.
        </p>
      </section>

      <section id="features" className="marketing-section panel">
        <div className="section-heading centered">
          <p className="eyebrow">المزايا الأساسية</p>
          <h3>كل ما يحتاجه التاجر في نقطة دخول واحدة</h3>
          <p>
            بنية الصفحة صممت لتقنع بسرعة ثم تنقل المستخدم إلى الخطوة التالية دون ازدحام أو إرباك.
          </p>
        </div>

        <div className="marketing-card-grid large">
          {featureCards.map((feature) => (
            <article key={feature.title} className="marketing-card marketing-card-feature">
              <div className="marketing-card-icon" aria-hidden="true">
                <span />
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="journey" className="marketing-section panel">
        <div className="section-heading">
          <p className="eyebrow">كيف يعمل</p>
          <h3>رحلة التاجر من أول زيارة حتى التشغيل</h3>
        </div>

        <div className="journey-grid">
          {journeySteps.map((step) => (
            <article key={step.step} className="journey-card">
              <span className="journey-step">{step.step}</span>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workspace" className="marketing-section panel marketing-workspace">
        <div className="section-heading">
          <p className="eyebrow">داخل البيئة</p>
          <h3>ما الذي سيجده التاجر بعد الدخول؟</h3>
          <p>
            ركزنا على إبراز قيمة لوحة التاجر وما الذي ينتظره بعد الضغط على زر التسجيل أو الدخول.
          </p>
        </div>

        <div className="workspace-grid">
          {workspaceCards.map((card) => (
            <article key={card.title} className="workspace-card">
              <h4>{card.title}</h4>
              <ul>
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="plans" className="marketing-section panel">
        <div className="section-heading centered">
          <p className="eyebrow">الجاهزية الحالية</p>
          <h3>النسخة الحالية مهيأة لرفع التحويل قبل ربط التسجيل الفعلي</h3>
        </div>

        <div className="plan-grid">
          {plans.map((plan) => (
            <article key={plan.name} className="plan-card">
              <div className="plan-badge">{plan.badge}</div>
              <h4>{plan.name}</h4>
              <p>{plan.description}</p>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-cta panel">
        <div>
          <p className="eyebrow">ابدأ الآن</p>
          <h3>إذا كانت الرحلة واضحة، فالخطوة الطبيعية هي التسجيل مباشرة</h3>
          <p>
            جعلنا أزرار التسجيل والدخول حاضرة من أول الهيدر حتى آخر الصفحة حتى لا يخسر التاجر
            مساره أثناء التصفح.
          </p>
        </div>

        <div className="marketing-hero-actions compact">
          <button className="primary" type="button" onClick={onCreateAccount}>
            الانتقال إلى إنشاء الحساب
          </button>
          <button type="button" onClick={onSignIn}>
            الانتقال إلى تسجيل الدخول
          </button>
        </div>
      </section>

      <section id="faq" className="marketing-section panel">
        <div className="section-heading">
          <p className="eyebrow">الأسئلة الشائعة</p>
          <h3>إجابات سريعة قبل البدء</h3>
        </div>

        <div className="faq-grid">
          {faqItems.map((item) => (
            <article key={item.question} className="faq-card">
              <h4>{item.question}</h4>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="marketing-footer panel">
        <div className="marketing-footer-brand">
          <p className="eyebrow">Kaleem Admin Hub</p>
          <h3>بوابة التاجر الرسمية داخل المنصة</h3>
          <p>
            تعريف، تسجيل، دخول، ثم تشغيل. كل ذلك من تطبيق واحد حتى تبقى رحلة التاجر واضحة وسريعة.
          </p>
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
          <button type="button" onClick={onSignIn}>
            تسجيل الدخول
          </button>
          <button className="primary" type="button" onClick={onCreateAccount}>
            إنشاء حساب
          </button>
        </div>
      </footer>
    </section>
  );
}
