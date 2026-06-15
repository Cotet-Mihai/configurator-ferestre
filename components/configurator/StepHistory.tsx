'use client';

import { STEPS } from '@/lib/configurator/steps';
import type { ConfiguratorAction, StepId } from '@/lib/configurator/types';

interface Props {
  completedSteps: StepId[];
  currentStepId: StepId;
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepHistory({ completedSteps, currentStepId, dispatch }: Props) {
  const allVisible = [...completedSteps, currentStepId];

  return (
    <nav
      aria-label="Pași configurare"
      className="flex items-center gap-1 px-6 py-4 bg-white border-b border-zinc-100 overflow-x-auto"
    >
      {allVisible.map((stepId, i) => {
        const isCompleted = i < completedSteps.length;
        const isCurrent = stepId === currentStepId;
        const label = STEPS[stepId].label;

        return (
          <div key={stepId} className="flex items-center gap-1 shrink-0">
            {i > 0 && (
              <span className="text-zinc-300 text-xs px-1">→</span>
            )}
            {isCompleted ? (
              <button
                onClick={() =>
                  dispatch({ type: 'JUMP_TO_STEP', payload: stepId })
                }
                className="text-sm text-zinc-500 hover:text-amber-700 hover:underline
                  transition-colors duration-150 focus:outline-none focus-visible:underline"
              >
                {label}
              </button>
            ) : (
              <span
                className={`text-sm ${
                  isCurrent
                    ? 'font-semibold text-zinc-900'
                    : 'text-zinc-400'
                }`}
              >
                {isCurrent && (
                  <span className="mr-1 text-amber-600">●</span>
                )}
                {label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
