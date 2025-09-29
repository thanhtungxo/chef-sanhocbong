import React from 'react';

// Define the Scholarship interface
interface Scholarship {
  id: string;
  name: string;
  eligible: boolean;
  reasons?: string[];
  description?: string;
  deadline?: string;
  amount?: string;
}

interface ScholarshipGridProps {
  scholarships: Scholarship[];
  onScholarshipClick: (scholarship: Scholarship) => void;
  fallbackMessage?: string;
}

/**
 * Generate a fallback avatar with 2-3 characters from the scholarship name
 * @param name - Scholarship name
 * @returns Abbreviation of the scholarship name
 */
const generateFallbackAvatar = (name: string): string => {
  // Split name into words and take first letter of each word
  const words = name.split(/\s+/);
  let abbreviation = '';
  
  if (words.length === 1) {
    // If only one word, take first 2-3 characters
    abbreviation = name.substring(0, 3).toUpperCase();
  } else {
    // If multiple words, take first letter of each word
    abbreviation = words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
  }
  
  return abbreviation;
};

/**
 * Format the scholarship reasons into a readable string
 * @param reasons - Array of reasons
 * @returns Formatted reasons string
 */
const formatReasons = (reasons?: string[]): string => {
  if (!reasons || reasons.length === 0) {
    return '';
  }
  return reasons.join('\n');
};

/**
 * ScholarshipGrid component displays a grid of eligible scholarships
 * with logos or fallback avatars, and handles empty state
 * @param scholarships - List of scholarships
 * @param onScholarshipClick - Function to call when a scholarship card is clicked
 */
export const ScholarshipGrid: React.FC<ScholarshipGridProps> = ({ 
  scholarships, 
  onScholarshipClick,
  fallbackMessage = "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin."
}) => {
  // Ensure we only display eligible scholarships
  const eligibleScholarships = scholarships.filter(s => s.eligible);
  
  if (!eligibleScholarships || eligibleScholarships.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">😔</div>
        <p className="text-gray-600 text-lg">{fallbackMessage}</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Scholarship Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {eligibleScholarships.map((scholarship) => {
          const fallbackAvatar = generateFallbackAvatar(scholarship.name);
          const reasonsText = formatReasons(scholarship.reasons);
          
          return (
            <div 
              key={scholarship.id} 
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 duration-200"
              onClick={() => onScholarshipClick(scholarship)}
            >
              {/* Header with Logo/Avatar */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center">
                <div className="w-20 h-20 bg-white text-blue-800 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  {fallbackAvatar}
                </div>
                <div className="mt-3 text-green-200 text-sm font-medium">
                  👍 Đủ điều kiện
                </div>
              </div>
              
              {/* Body with Details */}
              <div className="p-6">
                {/* Scholarship Name */}
                <h3 className="font-bold text-gray-900 text-lg mb-2">{scholarship.name}</h3>
                
                {/* Scholarship Description (if available) */}
                {scholarship.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{scholarship.description}</p>
                )}
                
                {/* Scholarship Details */}
                <div className="space-y-2 text-sm">
                  {scholarship.amount && (
                    <div className="flex items-center text-gray-700">
                      <span className="w-24 font-medium">Mức học bổng:</span>
                      <span>{scholarship.amount}</span>
                    </div>
                  )}
                  {scholarship.deadline && (
                    <div className="flex items-center text-gray-700">
                      <span className="w-24 font-medium">Hạn nộp:</span>
                      <span>{scholarship.deadline}</span>
                    </div>
                  )}
                </div>
                
                {/* Reasons (if available) */}
                {reasonsText && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                    <div className="font-medium mb-1">Lý do đủ điều kiện:</div>
                    <pre className="whitespace-pre-line text-xs">{reasonsText}</pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};