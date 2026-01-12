const LoadingLogo = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/croppedlogo.png" 
        alt="Loading" 
        className={`${sizeClasses[size]} animate-pulse`}
        style={{
          animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />
    </div>
  );
};

export default LoadingLogo;
