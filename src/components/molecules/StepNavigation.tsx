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
        <Button
          variant="secondary"
          onClick={onBack}
          className="bg-gradient-to-r from-secondary to-secondary/80 text-white hover:scale-105 transition-transform duration-200 h-11 px-6 rounded-md"
        >
          Back
        </Button>
      )}
      <Button
        onClick={onNext}
        className="bg-gradient-to-r from-primary to-primary/80 text-white hover:scale-105 transition-transform duration-200 h-11 px-6 rounded-md"
      >
        {isLastStep ? 'See Result' : 'Next'}
      </Button>
    </div>
  );
};
