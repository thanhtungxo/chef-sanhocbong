import React from 'react';

interface ReasonObject {
  message: string;
}

type Reason = string | ReasonObject;

interface Scholarship {
  id: string;
  name: string;
  eligible: boolean;
  reasons?: Reason[];
  description?: string;
  deadline?: string;
  amount?: string;
}

interface ResultCTAProps {
  eligibleScholarships: Scholarship[];
  onCTAClick: (scholarship?: Scholarship) => void;
}

export const ResultCTA: React.FC<ResultCTAProps> = ({ eligibleScholarships, onCTAClick }) => {
  const hasEligibleScholarships = eligibleScholarships.length > 0;

  const handleContinue = () => {
    if (hasEligibleScholarships && eligibleScholarships.length === 1) {
      // If there's only one eligible scholarship, pass it directly
      onCTAClick(eligibleScholarships[0]);
    } else {
      // Otherwise, just trigger the continuation without a specific scholarship
      onCTAClick();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
      {hasEligibleScholarships ? (
        <>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            onClick={handleContinue}
          >
            Tiếp tục với Smart Profile Analysis
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors duration-200"
            onClick={() => window.location.href = '/'} // Navigate back to home
          >
            Quay lại
          </button>
        </>
      ) : (
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
          onClick={() => window.location.href = '/'} // Navigate back to home
        >
          Quay về Trang chủ
        </button>
      )}
    </div>
  );
};