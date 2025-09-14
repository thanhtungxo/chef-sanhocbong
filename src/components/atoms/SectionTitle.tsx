import React from 'react';

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h2 className="text-xl font-bold mb-4">{children}</h2>;
};
