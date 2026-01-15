import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearchPlus, faSearchMinus } from '@fortawesome/free-solid-svg-icons';
import { createCroppedImage } from '../utils/cropImage';
import { useTranslation } from '../../node_modules/react-i18next';

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const { t, i18n } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => {
        setShouldRender(false);
        // Reset state when modal closes
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
      }, 300);
    }
  }, [isOpen]);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await createCroppedImage(
        imageSrc,
        croppedAreaPixels
      );
      
      // Convert Blob to File
      const croppedFile = new File([croppedBlob], 'profile-picture.jpg', {
        type: 'image/jpeg',
      });

      await onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleBackdropClick = (e) => {
    if (!isProcessing && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-200 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`bg-zinc-950/98 backdrop-blur-xl rounded-2xl w-full max-w-lg border border-zinc-800 shadow-2xl transition-all duration-300 ease-out ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">{t('editImage')}</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
            disabled={isProcessing}
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-80 bg-zinc-900" onMouseDown={(e) => e.stopPropagation()}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            restrictPosition={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            style={{
              containerStyle: {
                backgroundColor: '#18181b',
              },
              cropAreaStyle: {
                border: '2px solid #fff',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4 border-t border-zinc-800">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="text-zinc-400 font-medium">{t('zoom')}</label>
              <span className="text-zinc-500 text-xs">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon 
                icon={faSearchMinus} 
                className="text-zinc-500 text-sm" 
              />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform
                         [&::-webkit-slider-thumb]:hover:scale-110
                         [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white 
                         [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0
                         [&::-moz-range-thumb]:shadow-lg"
                disabled={isProcessing}
              />
              <FontAwesomeIcon 
                icon={faSearchPlus} 
                className="text-zinc-500 text-sm" 
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white 
                       rounded-lg transition-colors text-sm font-medium disabled:opacity-50 
                       disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {t('reset')}
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2.5 bg-[#c96f49] hover:bg-[#b85f39] text-white 
                       rounded-lg transition-colors text-sm font-medium disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('processing')}
                </>
              ) : (
                t('apply')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
