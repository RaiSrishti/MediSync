import React from 'react';

const Card = ({ children, className = '', title, actions, ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
