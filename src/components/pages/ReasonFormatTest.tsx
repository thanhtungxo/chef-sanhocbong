import React from 'react';
import { evaluateScholarshipsLocally } from '../../lib/submit';
import { ResultPage } from './ResultPage';
import { EligibilityResult } from '../../../types/eligibility';

// Mock function to simulate API call with mixed reasons formats
const mockEvaluateWithMixedReasons = async (): Promise<EligibilityResult> => {
  // Create mock data with both string and object reasons formats
  const mockResult: EligibilityResult = {
    applicationId: 'test-app-' + Date.now(),
    scholarships: [
      {
        id: 'aas',
        name: 'Australia Awards Scholarship',
        eligible: false,
        reasons: [
          'Your IELTS score does not meet the minimum requirement',
          { message: 'You need at least 2 years of full-time experience' },
          'Your company is not Vietnamese-owned'
        ]
      },
      {
        id: 'chevening',
        name: 'Chevening Scholarship',
        eligible: false,
        reasons: [
          { message: 'Your IELTS score does not meet the minimum (7.0)' },
          { message: 'Scholarship requires leadership potential' },
          'You must commit to return to your home country'
        ]
      },
      {
        id: 'fulbright',
        name: 'Fulbright Scholarship',
        eligible: true,
        reasons: ['All criteria met']
      }
    ]
  };
  
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockResult), 100);
  });
};

/**
 * Test component to verify that Reason format handling works correctly
 */
export const ReasonFormatTest: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [eligibilityResult, setEligibilityResult] = React.useState<EligibilityResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Get mock data with mixed reasons formats
        const result = await mockEvaluateWithMixedReasons();
        setEligibilityResult(result);
        setError(null);
      } catch (err) {
        setError('Failed to load test data: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error loading test data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading test data...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!eligibilityResult) {
    return <div className="p-8">No test data available</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Reason Format Test</h1>
      <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
        <h2 className="text-lg font-semibold mb-2">Testing Mixed Reasons Formats</h2>
        <p className="text-gray-700">
          This test verifies that the ResultPage component correctly handles both string and object formats for scholarship reasons.
        </p>
      </div>
      
      <ResultPage 
        userName="Test User"
        eligibilityResults={eligibilityResult.scholarships}
        cmsResultText="Test content from CMS"
      />
    </div>
  );
};