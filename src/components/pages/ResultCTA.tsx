import React from 'react';

interface ResultCTAProps {
  hasEligibleScholarships: boolean;
  onContinue: () => void;
  onBackToHome: () => void;
}

/**
 * ResultCTA component displays call-to-action buttons at the bottom of the ResultPage
 * with dynamic text and behavior based on scholarship eligibility
 * @param hasEligibleScholarships - Whether the user is eligible for any scholarships
 * @param onContinue - Function to call when "Continue" button is clicked
 * @param onBackToHome - Function to call when "Back to Home" button is clicked
 */
export const ResultCTA: React.FC<ResultCTAProps> = ({ 
  hasEligibleScholarships, 
  onContinue, 
  onBackToHome 
}) => {
  return (
    <div className="flex justify-center pt-4">
      <button
        onClick={hasEligibleScholarships ? onContinue : onBackToHome}
        className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
      >
        {hasEligibleScholarships 
          ? "Tiếp tục với Smart Profile Analysis" 
          : "Quay lại trang đầu"
        }
      </button>
    </div>
  );
};