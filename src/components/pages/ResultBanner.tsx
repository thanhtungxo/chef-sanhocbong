import React from 'react';

interface ResultBannerProps {
  hasEligibleScholarships: boolean;
}

/**
 * ResultBanner component displays the main banner at the top of the ResultPage
 * with a success icon and dynamic subheading based on scholarship eligibility
 * @param hasEligibleScholarships - Whether the user is eligible for any scholarships
 */
export const ResultBanner: React.FC<ResultBannerProps> = ({ hasEligibleScholarships }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
      {/* Success Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      {/* Main Heading */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Chúc mừng bạn đã hoàn thành bước đầu tiên!
      </h1>
      
      {/* Dynamic Subheading */}
      <p className="text-lg text-gray-600">
        {hasEligibleScholarships 
          ? "Bạn đủ điều kiện để apply vào học bổng dưới đây." 
          : "Rất tiếc, bạn chưa đủ điều kiện học bổng nào. Hãy tham khảo thêm để cải thiện hồ sơ."
        }
      </p>
    </div>
  );
};