// lib/configurator-ferestre/transitions.ts
import { STEPS } from './steps';
import type { ConfiguratorState, StepId } from './types';

export function getNextStep(state: ConfiguratorState): StepId {
  return STEPS[state.currentStepId].getNext(state);
}

export function getPreviousStep(completedSteps: StepId[]): StepId | null {
  return completedSteps.at(-1) ?? null;
}

// Câmpuri resetate la salt înapoi — cheia e pasul care le setează.
// Doar deciziile de ramificație; dimensiunile/culoarea/cantitatea (inputurile
// utilizatorului) NU se resetează, ca să rămână salvate la revenirea pe un pas.
const STEP_FIELDS: Partial<Record<StepId, (keyof ConfiguratorState)[]>> = {
  'glass-count': ['glassCount'],
  'opens': ['opens'],
  'oscilo': ['isOscilo'],
  'direction': ['openDirection', 'handleSide'],
  'active-pane': ['activePane', 'handleSide'],
  'handle-side': ['handleSide'],
};

export function getResetStateForJump(
  state: ConfiguratorState,
  targetStepId: StepId,
): Partial<ConfiguratorState> {
  const targetIndex = state.completedSteps.indexOf(targetStepId);
  // Resetăm doar pașii STRICT după țintă (păstrăm valoarea pasului-țintă).
  const stepsToReset = [
    ...state.completedSteps.slice(targetIndex + 1),
    state.currentStepId,
  ];

  const reset: Record<string, unknown> = {};
  for (const stepId of stepsToReset) {
    for (const field of STEP_FIELDS[stepId] ?? []) {
      reset[field] = null;
    }
  }
  return reset as Partial<ConfiguratorState>;
}
