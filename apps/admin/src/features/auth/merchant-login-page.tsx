import { MerchantLogin } from '../merchant/merchant-login';
import type { MerchantSession } from '../merchant/types';

interface MerchantLoginPageProps {
  onLoggedIn: (session: MerchantSession) => void;
  onBackHome: () => void;
  onCreateAccount: () => void;
}

export function MerchantLoginPage({
  onLoggedIn,
  onBackHome,
  onCreateAccount,
}: MerchantLoginPageProps) {
  return (
    <section className="auth-page" dir="rtl">
      <div className="auth-page-intro panel">
        <p className="eyebrow">تسجيل الدخول</p>
        <h2>مرحباً بعودتك إلى لوحة التاجر</h2>
        <p>
          استخدم حساب المتجر للوصول إلى `/merchant`. في هذه المرحلة جعلنا مسار الدخول مستقلاً
          وواضحاً داخل تطبيق الأدمن، مع الحفاظ على بقاء الصفحة التعريفية ونموذج التسجيل ضمن نفس
          المسار.
        </p>
        <div className="auth-benefits-list">
          <div className="auth-benefit-card">
            <strong>الوصول المباشر إلى لوحة التاجر بعد تسجيل الدخول.</strong>
          </div>
          <div className="auth-benefit-card">
            <strong>تذكر رابط الـ API محلياً لسهولة الاختبار وإعادة الاستخدام.</strong>
          </div>
          <div className="auth-benefit-card">
            <strong>ربط واضح بين الصفحة التعريفية، التسجيل، والدخول داخل نفس التطبيق.</strong>
          </div>
        </div>
        <div className="auth-page-links">
          <button type="button" onClick={onBackHome}>
            العودة للرئيسية
          </button>
          <button className="primary" type="button" onClick={onCreateAccount}>
            إنشاء حساب جديد
          </button>
        </div>
      </div>

      <MerchantLogin onLoggedIn={onLoggedIn} />
    </section>
  );
}
