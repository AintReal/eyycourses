import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const ConfirmDialog = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-lg" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <p className="text-gray-300 mb-6 ml-12">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-all duration-200 border border-zinc-600"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-all duration-200"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
