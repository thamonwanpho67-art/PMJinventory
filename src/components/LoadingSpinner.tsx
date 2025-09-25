'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'pink' | 'blue' | 'green' | 'gray';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'pink', 
  text = 'กำลังโหลด...', 
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const colorClasses = {
    pink: 'border-pink-200 border-t-pink-600',
    blue: 'border-blue-200 border-t-blue-600',
    green: 'border-green-200 border-t-green-600',
    gray: 'border-gray-200 border-t-gray-600'
  };

  const textColorClasses = {
    pink: 'text-pink-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-600'
  };

  const backgroundClasses = {
    pink: 'from-pink-50 to-rose-100',
    blue: 'from-blue-50 to-indigo-100',
    green: 'from-green-50 to-emerald-100',
    gray: 'from-gray-50 to-slate-100'
  };

  const spinnerContent = (
    <div className="text-center">
      <div className={`animate-spin rounded-full border-4 mx-auto mb-4 ${sizeClasses[size]} ${colorClasses[color]}`}></div>
      {text && <p className={`font-medium font-kanit ${textColorClasses[color]}`}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${backgroundClasses[color]} ${className}`}>
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      {spinnerContent}
    </div>
  );
}