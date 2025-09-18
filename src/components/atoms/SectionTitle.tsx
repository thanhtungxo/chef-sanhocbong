import React from 'react';

export const SectionTitle: React.FC<{ children: React.ReactNode; subtitle?: React.ReactNode }>
  = ({ children, subtitle }) => {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-heading font-semibold bg-gradient-to-r from-green-500 to-orange-400 bg-clip-text text-transparent">
        {children}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
};
