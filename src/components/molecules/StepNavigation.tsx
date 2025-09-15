import React from 'react';

interface Props {
  onBack: () => void;
  onNext: () => void;
  showBack?: boolean;
  isLastStep?: boolean;
}

export const StepNavigation: React.FC<Props> = ({ onBack, onNext, showBack = true, isLastStep = false }) => {
  return (
    <div className="flex justify-between mt-4">
      {showBack && <button onClick={onBack} className="btn">Back</button>}
      <button onClick={onNext} className="btn btn-primary">{isLastStep ? 'See Result' : 'Next'}</button>
    </div>
  );
};

