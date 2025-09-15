import React from 'react';
import { ResultMessage } from '../molecules/ResultMessage';
import { SectionTitle } from '../atoms/SectionTitle';

interface Props {
  aasEligible: boolean;
  cheveningEligible: boolean;
  aasReasons: string[];
  cheveningReasons: string[];
  onRestart: () => void;
}

export const EligibilityResultStep: React.FC<Props> = ({
  aasEligible,
  cheveningEligible,
  aasReasons,
  cheveningReasons,
  onRestart,
}) => {
  return (
    <div>
      <SectionTitle>Eligibility Result</SectionTitle>

      <div className="mb-6">
        <ResultMessage
          message={aasEligible ? 'You are eligible for AAS' : 'Not eligible for AAS'}
          type={aasEligible ? 'success' : 'error'}
        />
        {!aasEligible && (
          <ul className="list-disc ml-6 text-sm text-gray-600">
            {aasReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-6">
        <ResultMessage
          message={cheveningEligible ? 'You are eligible for Chevening' : 'Not eligible for Chevening'}
          type={cheveningEligible ? 'success' : 'error'}
        />
        {!cheveningEligible && (
          <ul className="list-disc ml-6 text-sm text-gray-600">
            {cheveningReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-center mt-6">
        <button onClick={onRestart} className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
          Restart Form
        </button>
      </div>
    </div>
  );
};

