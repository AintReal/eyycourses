import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '../../node_modules/react-i18next';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  const { t, i18n } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-200 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`bg-zinc-950/98 backdrop-blur-xl rounded-2xl w-full max-w-md border border-zinc-800 shadow-2xl transition-all duration-300 ease-out ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faTrash} className="text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">{t('deleteProfilePicture')}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
            disabled={isDeleting}
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-300 text-sm leading-relaxed">
            {t('deleteProfilePictureConfirmation')}
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white 
                     rounded-lg transition-colors text-sm font-medium disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white 
                     rounded-lg transition-colors text-sm font-medium disabled:opacity-50 
                     disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('deleting')}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} />
                {t('delete')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
