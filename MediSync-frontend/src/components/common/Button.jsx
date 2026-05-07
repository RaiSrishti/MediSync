import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95';
  
  const variants = {
    primary: 'btn-primary focus:ring-teal-500',
    secondary: 'btn-secondary focus:ring-gray-500',
    success: 'btn-success focus:ring-emerald-500',
    warning: 'btn-warning focus:ring-amber-500',
    danger: 'btn-danger focus:ring-red-500',
    outline: 'border-2 border-teal-500 text-teal-600 hover:bg-teal-50 hover:text-teal-700 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg',
    ghost: 'text-teal-600 hover:bg-teal-50 hover:text-teal-700 bg-transparent shadow-none hover:shadow-md'
  };
  
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !loading && (
        <span className="mr-2 text-lg">{icon}</span>
      )}
      {children}
    </button>
  );
};

export default Button;
