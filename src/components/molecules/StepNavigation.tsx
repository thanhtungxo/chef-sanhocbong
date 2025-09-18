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
          className="bg-gradient-to-r from-blue-500 to-blue-400 text-white hover:scale-105 hover:shadow-xl transition-transform duration-200 h-11 px-7 rounded-full"
        >
          Back
        </Button>
      )}
      <Button
        onClick={onNext}
        className="bg-gradient-to-r from-green-500 to-orange-400 text-white hover:scale-105 hover:shadow-xl transition-transform duration-200 h-11 px-8 rounded-full"
      >
        {isLastStep ? 'See Result' : 'Next'}
      </Button>
    </div>
  );
};
