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
    <span
      onClick={toggleLanguage}
      className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer text-sm"
      style={{ fontFamily: i18n.language === 'ar' ? "'Ubuntu', system-ui, sans-serif" : "'Harmattan', 'Ubuntu', system-ui, sans-serif" }}
      title="Switch Language"
    >
      {i18n.language === 'en' ? 'عربي' : 'EN'}
    </span>
  );
};

export default LanguageSwitcher;
