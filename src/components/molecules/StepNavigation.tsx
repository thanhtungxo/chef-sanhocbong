import React from 'react';
import { Button } from '@/components/atoms/Button';

interface Props {
  onBack: () => void;
  onNext: () => void;
  showBack?: boolean;
  isLastStep?: boolean;
}

export const StepNavigation: React.FC<Props> = ({ onBack, onNext, showBack = true, isLastStep = false }) => {
  return (
    <div className="flex justify-between mt-4 gap-2">
      {showBack && (
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      )}
      <Button onClick={onNext}>{isLastStep ? 'See Result' : 'Next'}</Button>
    </div>
  );
};
