import { useTranslation } from '../../node_modules/react-i18next';
import { useEffect } from 'react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.body.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`fixed top-4 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg border border-zinc-600 transition-colors z-50 font-medium text-sm ${
        i18n.language === 'ar' ? 'left-4' : 'right-4'
      }`}
    >
      {i18n.language === 'en' ? 'ع' : 'EN'}
    </button>
  );
};

export default LanguageSwitcher;
