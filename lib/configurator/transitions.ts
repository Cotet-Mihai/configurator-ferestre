// lib/configurator/transitions.ts
import { STEPS } from './steps';
import type { ConfiguratorState, StepId } from './types';

export function getNextStep(state: ConfiguratorState): StepId {
  return STEPS[state.currentStepId].getNext(state);
}

export function getPreviousStep(completedSteps: StepId[]): StepId | null {
  return completedSteps.at(-1) ?? null;
}

// Fields reset when jumping back — keyed by the step that sets them
const STEP_FIELDS: Partial<Record<StepId, (keyof ConfiguratorState)[]>> = {
  'glass-count': ['glassCount'],
  'opens': ['opens'],
  'oscilo': ['isOscilo'],
  'direction': ['openDirection', 'handleSide'],
  'active-pane': ['activePane', 'handleSide'],
  'handle-side': ['handleSide'],
  'dimensions': ['dimensions'],
  'configuration': ['selectedGlass', 'selectedColor', 'selectedHardware', 'quantity'],
};

export function getResetStateForJump(
  state: ConfiguratorState,
  targetStepId: StepId,
): Partial<ConfiguratorState> {
  const targetIndex = state.completedSteps.indexOf(targetStepId);
  const stepsToReset = [
    ...state.completedSteps.slice(targetIndex),
    state.currentStepId,
  ];

  const reset: Record<string, unknown> = {};
  for (const stepId of stepsToReset) {
    for (const field of STEP_FIELDS[stepId] ?? []) {
      if (field === 'dimensions') {
        reset.dimensions = { width: null, height: null };
      } else if (field === 'quantity') {
        reset.quantity = 1;
      } else {
        reset[field] = null;
      }
    }
  }
  return reset as Partial<ConfiguratorState>;
}
