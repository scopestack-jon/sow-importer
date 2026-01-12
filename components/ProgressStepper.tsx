'use client';

import { CheckIcon } from './icons/CheckIcon';

export type Step = {
  id: string;
  label: string;
  description?: string;
};

type ProgressStepperProps = {
  steps: Step[];
  currentStep: number;
};

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-center gap-2 md:gap-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center gap-3">
                {/* Step indicator */}
                <div
                  className={`
                    relative flex h-10 w-10 items-center justify-center rounded-full
                    border-2 transition-all duration-300 ease-out
                    ${isCompleted 
                      ? 'border-[var(--success)] bg-[var(--success)] text-white' 
                      : isCurrent 
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-md' 
                        : 'border-[var(--border)] bg-[var(--background)] text-[var(--neutral-400)]'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-5 w-5 animate-fade-in" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                  
                  {/* Pulse ring for current step */}
                  {isCurrent && (
                    <span className="absolute -inset-1 animate-pulse rounded-full border-2 border-[var(--accent)] opacity-50" />
                  )}
                </div>

                {/* Step label */}
                <div className="hidden sm:block">
                  <p
                    className={`
                      text-sm font-medium transition-colors duration-200
                      ${isCompleted || isCurrent 
                        ? 'text-[var(--foreground)]' 
                        : 'text-[var(--neutral-400)]'
                      }
                    `}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-[var(--neutral-500)]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    mx-2 h-0.5 w-8 md:w-16 transition-colors duration-300
                    ${index < currentStep 
                      ? 'bg-[var(--success)]' 
                      : 'bg-[var(--border)]'
                    }
                  `}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const STEPS: Step[] = [
  { id: 'upload', label: 'Upload', description: 'Select your SOW document' },
  { id: 'review', label: 'Review', description: 'Verify extracted data' },
  { id: 'export', label: 'Export', description: 'Download for ScopeStack' },
];
