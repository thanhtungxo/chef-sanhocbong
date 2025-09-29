import React from 'react';
import { ResultPage } from './ResultPage';

// Mock data with mixed reasons formats (strings and objects)
const mockEligibilityResults = [
  {
    id: 'aas',
    name: 'AAS Scholarship',
    eligible: true,
    reasons: ['Full criteria met']
  },
  {
    id: 'chevening',
    name: 'Chevening Scholarship',
    eligible: false,
    reasons: [
      'English proficiency score too low',
      { message: 'Not enough work experience' }
    ]
  },
  {
    id: 'fulbright',
    name: 'Fulbright Scholarship',
    eligible: false,
    reasons: [
      { message: 'GPA requirement not met' },
      'Field of study not supported'
    ]
  }
];

/**
 * Test component to verify ResultPage handles mixed reasons formats
 */
export const ResultPageTest: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">ResultPage Test Component</h1>
      <h2 className="text-lg mb-2">Testing mixed reasons formats (strings and objects)</h2>
      
      <ResultPage 
        userName="John Doe"
        eligibilityResults={mockEligibilityResults}
        cmsResultText="Continue to detailed analysis"
      />
    </div>
  );
};