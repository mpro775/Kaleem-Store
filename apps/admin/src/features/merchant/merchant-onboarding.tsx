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
    <section className="panel panel-merchant merchant-onboarding" dir="rtl">
      <header className="panel-header onboarding-hero">
        <p className="eyebrow">أهلاً بك في لوحة التاجر</p>
        <h2>تم إنشاء حسابك بنجاح يا {session.user.fullName}</h2>
        <p>
          الخطوة التالية هي تجهيز متجرك بسرعة قبل الدخول إلى جميع أقسام لوحة التحكم. هذا onboarding
          خفيف حتى يوضح للتاجر أولويات البداية بدون إرباك.
        </p>
      </header>

      <section className="onboarding-highlight-grid">
        <article className="onboarding-highlight-card">
          <strong>البريد</strong>
          <p>{session.user.email}</p>
        </article>
        <article className="onboarding-highlight-card">
          <strong>المتجر</strong>
          <p>{session.user.storeId}</p>
        </article>
        <article className="onboarding-highlight-card">
          <strong>الدور</strong>
          <p>{session.user.role}</p>
        </article>
      </section>

      <section className="onboarding-steps-grid">
        {setupSteps.map((step, index) => (
          <article key={step.title} className="onboarding-step-card">
            <span className="journey-step">0{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </section>

      <section className="onboarding-next panel">
        <div>
          <p className="eyebrow">الخطوة التالية</p>
          <h3>هل تريد الدخول الآن إلى لوحة التاجر؟</h3>
          <p>
            عند المتابعة ستدخل إلى `/merchant` بكامل الأقسام. ويمكنك لاحقاً إضافة المنتجات وضبط
            الشحن والثيمات ثم معاينة المتجر العام.
          </p>
        </div>

        <div className="dashboard-actions onboarding-actions">
          <button className="primary" onClick={onContinue}>
            ابدأ إعداد المتجر
          </button>
          <button onClick={onSignedOut}>تسجيل الخروج</button>
        </div>
      </section>
    </section>
  );
}
