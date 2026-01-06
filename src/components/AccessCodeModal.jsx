import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '../../node_modules/react-i18next';

const AccessCodeModal = ({ onValidate, onSuccess }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate code format (8 characters)
    if (code.length !== 8) {
      setError('Access code must be exactly 8 characters');
      setLoading(false);
      return;
    }

    try {
      const result = await onValidate(code.toUpperCase());
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Invalid or already used access code');
      }
    } catch (err) {
      setError('An error occurred validating your code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-sm rounded-2xl p-8 bg-zinc-900/90 border border-zinc-700/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
              <FontAwesomeIcon icon={faKey} className="text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('enterAccessCode')}</h2>
            <p className="text-gray-400 text-sm">
              {t('accessCodeRequired')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2.5">
                {t('accessCode')}
              </label>
              <div className="relative">
                <input 
                  className="w-full px-4 py-3.5 bg-black/50 border border-zinc-700/70 rounded-xl text-white text-center text-lg font-mono tracking-widest uppercase placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition duration-200 hover:border-zinc-600"
                  type="text"
                  name="accessCode"
                  id="accessCode" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {code.length}/8 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5">
                <p className="text-red-400 text-sm font-medium text-center">{error}</p>
              </div>
            )}

            <button 
              className="w-full py-3.5 bg-white hover:bg-gray-100 active:bg-gray-200 font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:hover:shadow-lg text-[15px]"
              type="submit"
              disabled={loading || code.length !== 8}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-white">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  {t('verifying')}
                </span>
              ) : (
                <span className="text-white">{t('verify')}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Access codes are single-use only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessCodeModal;
