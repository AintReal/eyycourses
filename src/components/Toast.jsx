import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faXmarkCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const styles = {
    success: {
      icon: faCheckCircle,
    },
    error: {
      icon: faXmarkCircle,
    },
  };

  const style = styles[type] || styles.success;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-out ${
        isExiting 
          ? 'opacity-0 -translate-y-5' 
          : 'opacity-100 translate-y-0 animate-slideIn'
      }`}
    >
      <div className="bg-zinc-800/95 backdrop-blur-xl border border-zinc-700 rounded-lg px-4 py-3 shadow-2xl flex items-center gap-3 min-w-75 max-w-md">
        <FontAwesomeIcon icon={style.icon} className="text-zinc-400 text-lg" />
        <p className="text-white flex-1 text-sm">{message}</p>
        <button
          onClick={handleClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
