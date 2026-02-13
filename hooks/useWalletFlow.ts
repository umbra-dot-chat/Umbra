import { useState, useCallback, useMemo } from 'react';

interface UseWalletFlowOptions {
  totalSteps: number;
  onComplete?: () => void;
}

interface UseWalletFlowReturn {
  currentStep: number;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  reset: () => void;
}

export function useWalletFlow({ totalSteps, onComplete }: UseWalletFlowOptions): UseWalletFlowReturn {
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= totalSteps - 1) {
        onComplete?.();
        return prev;
      }
      return prev + 1;
    });
  }, [totalSteps, onComplete]);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps],
  );

  const reset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return useMemo(
    () => ({ currentStep, goNext, goBack, goToStep, isFirstStep, isLastStep, reset }),
    [currentStep, goNext, goBack, goToStep, isFirstStep, isLastStep, reset],
  );
}
