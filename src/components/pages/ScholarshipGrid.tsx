import React from 'react';

// Define the Scholarship interface
interface Scholarship {
  id: string;
  name: string;
  eligible: boolean;
  reasons: string[];
}

interface ScholarshipGridProps {
  eligibleScholarships: Scholarship[];
  onScholarshipClick: (scholarship: Scholarship) => void;
  fallbackMessage: string;
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
 * ScholarshipGrid component displays a grid of eligible scholarships
 * with logos or fallback avatars, and handles empty state
 * @param eligibleScholarships - List of scholarships the user is eligible for
 * @param onScholarshipClick - Function to call when a scholarship card is clicked
 */
export const ScholarshipGrid: React.FC<ScholarshipGridProps> = ({ 
  eligibleScholarships, 
  onScholarshipClick,
  fallbackMessage
}) => {
  const hasEligibleScholarships = eligibleScholarships.length > 0;
  
  if (!hasEligibleScholarships) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
        {/* Sad Face Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 13.8V16a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.2M6 15h.01M17 15h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        <p className="text-gray-600">
          {fallbackMessage}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Học bổng bạn đủ điều kiện
      </h2>
      
      {/* Scholarship Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {eligibleScholarships.map((scholarship) => {
          const fallbackAvatar = generateFallbackAvatar(scholarship.name);
          
          return (
            <div 
              key={scholarship.id} 
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onScholarshipClick(scholarship)}
            >
              {/* Logo or Fallback Avatar */}
              <div className="h-24 bg-gray-100 flex items-center justify-center">
                {/* For now, we'll just use the fallback avatar since we don't have actual logos */}
                <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold">
                  {fallbackAvatar}
                </div>
              </div>
              
              {/* Scholarship Name */}
              <div className="p-4 text-center">
                <h3 className="font-medium text-gray-900 truncate">
                  {scholarship.name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};