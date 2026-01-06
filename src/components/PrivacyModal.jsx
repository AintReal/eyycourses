import { useTranslation } from '../../node_modules/react-i18next';

const PrivacyModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-800 rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-y-auto m-4 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-zinc-800 border-b border-zinc-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{t('privacyTitle')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 text-gray-300 space-y-6">
          <p className="text-sm text-gray-400">{t('privacyLastUpdated')}</p>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-white">{t('privacyInfo')}</h3>
            <p>{t('privacyInfoDesc')}</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-white">{t('privacyUse')}</h3>
            <p>{t('privacyUseDesc')}</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-white">{t('privacySharing')}</h3>
            <p>{t('privacySharingDesc')}</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-white">{t('privacySecurity')}</h3>
            <p>{t('privacySecurityDesc')}</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-white">{t('privacyRights')}</h3>
            <p>{t('privacyRightsDesc')}</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-white">{t('privacyContact')}</h3>
            <p>{t('privacyContactDesc')}</p>
          </section>

          <div className="pt-4 border-t border-zinc-700">
            <button
              onClick={onClose}
              className="w-full bg-zinc-700 text-white py-2 px-4 rounded-md hover:bg-zinc-600 transition"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;
