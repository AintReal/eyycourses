import i18n from 'i18next';
import { initReactI18next } from '../node_modules/react-i18next';

const resources = {
  en: {
    translation: {
      "signin": "Sign In",
      "signup": "Sign Up",
      "signout": "Sign Out",
      "email": "Email",
      "password": "Password",
      "name": "Name",
      "continueWithGoogle": "Continue with Google",
      "dontHaveAccount": "Don't have an account?",
      "alreadyHaveAccount": "Already have an account?",
      "welcome": "Welcome to eyycourses",
      "selectLesson": "Select a lesson from the sidebar to get started",
      
      "dashboard": "Dashboard",
      "comingSoon": "Soon",
      
      "variables": "Variables",
      "functions": "Functions",
      "strings": "Strings",
      "contentFor": "Content for {{lesson}} will be displayed here.",
      
      "enterAccessCode": "Enter Access Code",
      "accessCodeRequired": "Please enter your 8-character access code to continue",
      "accessCode": "Access Code",
      "verify": "Verify",
      "invalidCode": "Invalid or already used code",
      
      "signingIn": "Signing in...",
      "creatingAccount": "Creating account...",
      "verifying": "Verifying...",
      
      "allRightsReserved": "All rights reserved",
      "privacyPolicyLink": "Privacy Policy",
      "termsOfServiceLink": "Terms of Service",
      
      "privacyTitle": "Privacy Policy",
      "termsTitle": "Terms of Service",
      "close": "Close",
      "privacyLastUpdated": "Last updated: January 2026",
      "termsLastUpdated": "Last updated: January 2026",
      
      "privacyInfo": "Information We Collect",
      "privacyInfoDesc": "We collect information you provide directly to us, including your name, email address, and any other information you choose to provide when using our services.",
      "privacyUse": "How We Use Your Information",
      "privacyUseDesc": "We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to protect our users.",
      "privacySharing": "Information Sharing",
      "privacySharingDesc": "We do not sell your personal information. We may share your information with service providers who help us operate our platform.",
      "privacySecurity": "Security",
      "privacySecurityDesc": "We take reasonable measures to protect your information from unauthorized access, use, or disclosure.",
      "privacyRights": "Your Rights",
      "privacyRightsDesc": "You have the right to access, update, or delete your personal information at any time.",
      "privacyContact": "Contact Us",
      "privacyContactDesc": "If you have questions about this Privacy Policy, please contact us at privacy@eyycourses.com",
      
      "termsAcceptance": "Acceptance of Terms",
      "termsAcceptanceDesc": "By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.",
      "termsLicense": "Use License",
      "termsLicenseDesc": "Permission is granted to temporarily access the materials on eyycourses for personal, non-commercial use only.",
      "termsAccount": "User Account",
      "termsAccountDesc": "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities under your account.",
      "termsConduct": "User Conduct",
      "termsConductDesc": "You agree not to use the service for any unlawful purpose or in any way that might harm, damage, or disparage any other party.",
      "termsTermination": "Termination",
      "termsTerminationDesc": "We may terminate or suspend your account and access to the service immediately, without prior notice, for any breach of these Terms.",
      "termsContactInfo": "Contact Information",
      "termsContactDesc": "For any questions about these Terms, please contact us at support@eyycourses.com"
    }
  },
  ar: {
    translation: {
      "signin": "تسجيل الدخول",
      "signup": "إنشاء حساب",
      "signout": "تسجيل الخروج",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "name": "الاسم",
      "continueWithGoogle": "المتابعة مع جوجل",
      "dontHaveAccount": "ليس لديك حساب؟",
      "alreadyHaveAccount": "لديك حساب بالفعل؟",
      "welcome": "مرحباً بك في eyycourses",
      "selectLesson": "اختر درساً من الشريط الجانبي للبدء",
      
      "dashboard": "لوحة التحكم",
      "comingSoon": "قريباً",
      
      "variables": "المتغيرات",
      "functions": "الدوال",
      "strings": "النصوص",
      "contentFor": "سيتم عرض محتوى {{lesson}} هنا.",
      
      "enterAccessCode": "أدخل رمز الوصول",
      "accessCodeRequired": "يرجى إدخال رمز الوصول المكون من 8 أحرف للمتابعة",
      "accessCode": "رمز الوصول",
      "verify": "تحقق",
      "invalidCode": "رمز غير صالح أو مستخدم بالفعل",
      
      "signingIn": "جاري تسجيل الدخول...",
      "creatingAccount": "جاري إنشاء الحساب...",
      "verifying": "جاري التحقق...",
      
      "allRightsReserved": "جميع الحقوق محفوظة",
      "privacyPolicyLink": "سياسة الخصوصية",
      "termsOfServiceLink": "شروط الخدمة",
      
      "privacyTitle": "سياسة الخصوصية",
      "termsTitle": "شروط الخدمة",
      "close": "إغلاق",
      "privacyLastUpdated": "آخر تحديث: يناير 2026",
      "termsLastUpdated": "آخر تحديث: يناير 2026",
      
      "privacyInfo": "المعلومات التي نجمعها",
      "privacyInfoDesc": "نجمع المعلومات التي تقدمها لنا مباشرة، بما في ذلك اسمك وعنوان بريدك الإلكتروني وأي معلومات أخرى تختار تقديمها عند استخدام خدماتنا.",
      "privacyUse": "كيف نستخدم معلوماتك",
      "privacyUseDesc": "نستخدم المعلومات التي نجمعها لتوفير خدماتنا وصيانتها وتحسينها، وللتواصل معك، ولحماية مستخدمينا.",
      "privacySharing": "مشاركة المعلومات",
      "privacySharingDesc": "نحن لا نبيع معلوماتك الشخصية. قد نشارك معلوماتك مع مقدمي الخدمات الذين يساعدوننا في تشغيل منصتنا.",
      "privacySecurity": "الأمان",
      "privacySecurityDesc": "نتخذ تدابير معقولة لحماية معلوماتك من الوصول أو الاستخدام أو الكشف غير المصرح به.",
      "privacyRights": "حقوقك",
      "privacyRightsDesc": "لديك الحق في الوصول إلى معلوماتك الشخصية أو تحديثها أو حذفها في أي وقت.",
      "privacyContact": "اتصل بنا",
      "privacyContactDesc": "إذا كان لديك أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على privacy@eyycourses.com",
      
      "termsAcceptance": "قبول الشروط",
      "termsAcceptanceDesc": "من خلال الوصول إلى هذه الخدمة واستخدامها، فإنك تقبل وتوافق على الالتزام بشروط وأحكام هذه الاتفاقية.",
      "termsLicense": "ترخيص الاستخدام",
      "termsLicenseDesc": "يُمنح الإذن بالوصول المؤقت إلى المواد على eyycourses للاستخدام الشخصي غير التجاري فقط.",
      "termsAccount": "حساب المستخدم",
      "termsAccountDesc": "أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور الخاصة بك. أنت توافق على قبول المسؤولية عن جميع الأنشطة تحت حسابك.",
      "termsConduct": "سلوك المستخدم",
      "termsConductDesc": "أنت توافق على عدم استخدام الخدمة لأي غرض غير قانوني أو بأي طريقة قد تضر أو تلحق الضرر بأي طرف آخر.",
      "termsTermination": "الإنهاء",
      "termsTerminationDesc": "يجوز لنا إنهاء أو تعليق حسابك والوصول إلى الخدمة فوراً، دون إشعار مسبق، لأي انتهاك لهذه الشروط.",
      "termsContactInfo": "معلومات الاتصال",
      "termsContactDesc": "لأي أسئلة حول هذه الشروط، يرجى الاتصال بنا على support@eyycourses.com"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
