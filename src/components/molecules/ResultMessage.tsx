import React from 'react';

interface Props {
  message: string;
  type: 'success' | 'error';
}

export const ResultMessage: React.FC<Props> = ({ message, type }) => {
  return (
    <div className={`p-4 rounded ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {message}
    </div>
  );
};
