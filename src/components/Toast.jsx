import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-600/90',
      border: 'border-green-500/50',
      icon: faCheckCircle,
      iconColor: 'text-green-300'
    },
    error: {
      bg: 'bg-red-600/90',
      border: 'border-red-500/50',
      icon: faExclamationCircle,
      iconColor: 'text-red-300'
    },
    info: {
      bg: 'bg-blue-600/90',
      border: 'border-blue-500/50',
      icon: faInfoCircle,
      iconColor: 'text-blue-300'
    }
  };

  const style = styles[type] || styles.success;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className={`${style.bg} backdrop-blur-xl border ${style.border} rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 min-w-75 max-w-md`}>
        <FontAwesomeIcon icon={style.icon} className={`${style.iconColor} text-lg`} />
        <p className="text-white flex-1 text-sm">{message}</p>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
