// lib/configurator/steps.ts
import type { ConfiguratorState, StepId, StepNode } from './types';

export const STEPS: Record<StepId, StepNode> = {
  'glass-count': {
    id: 'glass-count',
    label: 'Număr geamuri',
    getNext: () => 'opens',
  },
  'opens': {
    id: 'opens',
    label: 'Deschidere',
    getNext: (s) => (s.opens ? 'oscilo' : 'dimensions'),
  },
  'oscilo': {
    id: 'oscilo',
    label: 'Oscilobatant',
    getNext: (s) => (s.glassCount === 1 ? 'direction' : 'active-pane'),
  },
  'direction': {
    id: 'direction',
    label: 'Direcție deschidere',
    getNext: () => 'dimensions',
  },
  'active-pane': {
    id: 'active-pane',
    label: 'Geam activ',
    getNext: (s) => (s.activePane === 'both' ? 'handle-side' : 'dimensions'),
  },
  'handle-side': {
    id: 'handle-side',
    label: 'Poziție mâner',
    getNext: () => 'dimensions',
  },
  'dimensions': {
    id: 'dimensions',
    label: 'Configurare',
    getNext: () => 'summary',
  },
  'summary': {
    id: 'summary',
    label: 'Sumar',
    getNext: () => 'summary',
  },
};
