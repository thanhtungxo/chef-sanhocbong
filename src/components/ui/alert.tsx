import React, { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  className?: string;
}

interface AlertTitleProps {
  children: ReactNode;
  className?: string;
}

interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800 ${className}`}>
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<AlertTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`font-medium text-lg mb-1 ${className}`}>
      {children}
    </h3>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-sm ${className}`}>
      {children}
    </p>
  );
};