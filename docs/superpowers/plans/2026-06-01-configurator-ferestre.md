# Configurator Ferestre din Lemn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullscreen window configurator with a dynamic step machine, real-time SVG preview, and price calculator that receives a product JSON and returns a configuration + pricing JSON.

**Architecture:** Dynamic stepper implemented as an explicit state machine — each step node knows its successor via `getNext(state)`. Global state lives in `useReducer` inside `ConfiguratorShell`. All logic (transitions, pricing) is pure TypeScript in `lib/` and completely decoupled from React.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5 strict, Tailwind CSS v4, Framer Motion, native SVG

---

## File Map

| File | Responsibility |
|---|---|
| `lib/configurator/types.ts` | All TypeScript interfaces and union types |
| `lib/configurator/steps.ts` | Step graph: `STEPS` record with `getNext` per node |
| `lib/configurator/transitions.ts` | `getNextStep`, `getPreviousStep`, `getResetStateForJump` |
| `lib/configurator/pricing.ts` | `calculatePrice` pure function |
| `lib/configurator/mock-product.ts` | Dev mock data (replaces WordPress JSON) |
| `components/configurator/ConfiguratorShell.tsx` | `useReducer` host, step renderer, root layout |
| `components/configurator/StepHistory.tsx` | Top bar: completed steps + current step |
| `components/configurator/BinaryChoice.tsx` | Shared 50/50 layout for 2-option steps |
| `components/configurator/steps/StepGlassCount.tsx` | Step: 1 geam / 2 geamuri |
| `components/configurator/steps/StepOpens.tsx` | Step: Se deschide? Da/Nu |
| `components/configurator/steps/StepOscilo.tsx` | Step: Oscilobatant? Da/Nu |
| `components/configurator/steps/StepDirection.tsx` | Step: Direcție stânga/dreapta |
| `components/configurator/steps/StepActivePane.tsx` | Step: Ce geam se deschide? (3 opțiuni) |
| `components/configurator/steps/StepHandleSide.tsx` | Step: Pe ce geam mânerul? |
| `components/configurator/steps/StepDimensions.tsx` | Step: Input lățime + înălțime + preview |
| `components/configurator/steps/StepConfiguration.tsx` | Step: Sticlă, culoare, feronerie, cantitate |
| `components/configurator/steps/StepSummary.tsx` | Step final: sumar + preț + output JSON |
| `components/configurator/WindowPreview.tsx` | SVG renderer fereastră (live, responsive) |
| `components/configurator/PriceSummary.tsx` | Afișare preț calculat |
| `app/configurator/page.tsx` | Server component: montează ConfiguratorShell cu mock data |
| `app/page.tsx` | Redirect la /configurator |

---

## Task 1: Setup — Framer Motion + Next.js 16 docs

**Files:**
- Read: `node_modules/next/dist/docs/` (canary — APIs pot diferi)

- [ ] **Step 1: Instalează Framer Motion**

```bash
pnpm add framer-motion
```

Expected output: `dependencies: + framer-motion x.x.x`

- [ ] **Step 2: Verifică docs Next.js 16 canary**

```bash
ls node_modules/next/dist/docs/
```

Citește fișierele relevante pentru App Router, `'use client'`, și route handlers dacă există diferențe față de Next.js 15 stable.

- [ ] **Step 3: Commit**

```bash
git add pnpm-lock.yaml package.json
git commit -m "chore: add framer-motion"
```

---

## Task 2: Foundation — types.ts

**Files:**
- Create: `lib/configurator/types.ts`

- [ ] **Step 1: Creează fișierul**

```typescript
// lib/configurator-ferestre/types.ts

export type GlassCount = 1 | 2;
export type OpenDirection = 'left' | 'right';
export type ActivePane = 'left' | 'right' | 'both';
export type HandleSide = 'left' | 'right';

export interface OptionItem {
  id: string;
  label: string;
  priceModifier?: number;
  colorValue?: string; // hex opțional pentru preview SVG
}

export interface ProductConfig {
  productId: number;
  productName: string;
  pricePerSquareMeter: number;
  glassOptions: OptionItem[];
  colorOptions: OptionItem[];
  hardwareOptions: OptionItem[];
}

export interface Dimensions {
  width: number | null;
  height: number | null;
}

export type StepId =
  | 'glass-count'
  | 'opens'
  | 'oscilo'
  | 'direction'
  | 'active-pane'
  | 'handle-side'
  | 'dimensions'
  | 'configuration'
  | 'summary';

export interface StepNode {
  id: StepId;
  label: string;
  getNext: (state: ConfiguratorState) => StepId;
}

export interface ConfiguratorState {
  product: ProductConfig;
  glassCount: GlassCount | null;
  opens: boolean | null;
  isOscilo: boolean | null;
  openDirection: OpenDirection | null;
  activePane: ActivePane | null;
  handleSide: HandleSide | null;
  dimensions: Dimensions;
  selectedGlass: string | null;
  selectedColor: string | null;
  selectedHardware: string | null;
  quantity: number;
  currentStepId: StepId;
  completedSteps: StepId[];
}

export type ConfiguratorAction =
  | { type: 'SET_GLASS_COUNT'; payload: GlassCount }
  | { type: 'SET_OPENS'; payload: boolean }
  | { type: 'SET_OSCILO'; payload: boolean }
  | { type: 'SET_DIRECTION'; payload: OpenDirection }
  | { type: 'SET_ACTIVE_PANE'; payload: ActivePane }
  | { type: 'SET_HANDLE_SIDE'; payload: HandleSide }
  | { type: 'SET_DIMENSIONS'; payload: Partial<Dimensions> }
  | { type: 'SET_GLASS'; payload: string }
  | { type: 'SET_COLOR'; payload: string }
  | { type: 'SET_HARDWARE'; payload: string }
  | { type: 'SET_QUANTITY'; payload: number }
  | { type: 'GO_BACK' }
  | { type: 'JUMP_TO_STEP'; payload: StepId };

export interface PricingInput {
  pricePerSquareMeter: number;
  dimensions: { width: number; height: number };
  opens: boolean;
  isOscilo: boolean;
  quantity: number;
}

export interface PricingResult {
  area: number;
  basePrice: number;
  unitPrice: number;
  finalPrice: number;
}

export interface ConfiguratorOutput {
  productId: number;
  configuration: {
    glassCount: GlassCount;
    opens: boolean;
    isOscilo: boolean;
    openDirection: OpenDirection | null;
    activePane: ActivePane | null;
    handleSide: HandleSide | null;
    dimensions: { width: number; height: number };
    glass: OptionItem | null;
    color: OptionItem | null;
    hardware: OptionItem | null;
    quantity: number;
  };
  pricing: {
    pricePerSqm: number;
    area: number;
    basePrice: number;
    unitPrice: number;
    finalPrice: number;
  };
}
```

- [ ] **Step 2: Verifică că TypeScript compilează**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors (fișierul e pur de tipuri, fără referințe la alte module)

- [ ] **Step 3: Commit**

```bash
git add lib/configurator-ferestre/types.ts
git commit -m "feat: add configurator TypeScript types"
```

---

## Task 3: Foundation — steps.ts, transitions.ts

**Files:**
- Create: `lib/configurator/steps.ts`
- Create: `lib/configurator/transitions.ts`

- [ ] **Step 1: Creează steps.ts**

```typescript
// lib/configurator-ferestre/steps.ts
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
    label: 'Dimensiuni',
    getNext: () => 'configuration',
  },
  'configuration': {
    id: 'configuration',
    label: 'Configurație',
    getNext: () => 'summary',
  },
  'summary': {
    id: 'summary',
    label: 'Sumar',
    getNext: () => 'summary',
  },
};
```

- [ ] **Step 2: Creează transitions.ts**

```typescript
// lib/configurator-ferestre/transitions.ts
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
```

- [ ] **Step 3: Verifică compilare**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/configurator-ferestre/steps.ts lib/configurator-ferestre/transitions.ts
git commit -m "feat: add step graph and transition logic"
```

---

## Task 4: Foundation — pricing.ts + mock-product.ts

**Files:**
- Create: `lib/configurator/pricing.ts`
- Create: `lib/configurator/mock-product.ts`

- [ ] **Step 1: Creează pricing.ts**

```typescript
// lib/configurator-ferestre/pricing.ts
import type { PricingInput, PricingResult } from './types';

export function calculatePrice(input: PricingInput): PricingResult {
  const area =
    (input.dimensions.width / 100) * (input.dimensions.height / 100);
  const basePrice = area * input.pricePerSquareMeter;

  const multiplier = input.isOscilo ? 1.6 : input.opens ? 1.5 : 1.0;

  const unitPrice = Math.round(basePrice * multiplier);
  const finalPrice = unitPrice * input.quantity;

  return {
    area: Math.round(area * 100) / 100,
    basePrice: Math.round(basePrice),
    unitPrice,
    finalPrice,
  };
}
```

- [ ] **Step 2: Verifică manual calculele în consolă**

Deschide un fișier temporar și rulează:
```typescript
// verificare manuală — șterge după
import { calculatePrice } from '@/lib/configurator-ferestre/pricing';
console.log(calculatePrice({ pricePerSquareMeter: 1300, dimensions: { width: 100, height: 100 }, opens: false, isOscilo: false, quantity: 1 }));
// Expected: { area: 1, basePrice: 1300, unitPrice: 1300, finalPrice: 1300 }
console.log(calculatePrice({ pricePerSquareMeter: 1300, dimensions: { width: 100, height: 100 }, opens: true, isOscilo: false, quantity: 1 }));
// Expected: { area: 1, basePrice: 1300, unitPrice: 1950, finalPrice: 1950 }
console.log(calculatePrice({ pricePerSquareMeter: 1300, dimensions: { width: 100, height: 100 }, opens: true, isOscilo: true, quantity: 1 }));
// Expected: { area: 1, basePrice: 1300, unitPrice: 2080, finalPrice: 2080 }
```

Notă: nu e nevoie să scrii un fișier de test separat. Verificarea se face vizual mai târziu în browser prin PriceSummary.

- [ ] **Step 3: Creează mock-product.ts**

```typescript
// lib/configurator-ferestre/mock-product.ts
import type { ProductConfig } from './types';

export const MOCK_PRODUCT: ProductConfig = {
  productId: 1,
  productName: 'Fereastră din lemn stejar',
  pricePerSquareMeter: 1300,
  glassOptions: [
    { id: 'glass-2', label: 'Geam dublu 4/16/4', priceModifier: 0 },
    { id: 'glass-3', label: 'Geam triplu 4/16/4/16/4', priceModifier: 150 },
  ],
  colorOptions: [
    { id: 'color-natural', label: 'Stejar natural', priceModifier: 0, colorValue: '#8B6914' },
    { id: 'color-white', label: 'Alb RAL 9016', priceModifier: 80, colorValue: '#F2F0EB' },
    { id: 'color-dark', label: 'Nuc închis', priceModifier: 60, colorValue: '#4A3728' },
  ],
  hardwareOptions: [
    { id: 'hw-standard', label: 'Feronerie standard', priceModifier: 0 },
    { id: 'hw-premium', label: 'Feronerie premium Roto', priceModifier: 200 },
  ],
};
```

- [ ] **Step 4: Verifică compilare**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add lib/configurator-ferestre/pricing.ts lib/configurator-ferestre/mock-product.ts
git commit -m "feat: add pricing engine and mock product data"
```

---

## Task 5: Core — ConfiguratorShell (useReducer + reducer)

**Files:**
- Create: `components/configurator/ConfiguratorShell.tsx`

- [ ] **Step 1: Creează ConfiguratorShell.tsx cu reducer și state inițial**

```tsx
// components/configurator-ferestre/ConfiguratorShell.tsx
'use client';

import { useReducer, useMemo } from 'react';
import type {
  ProductConfig,
  ConfiguratorState,
  ConfiguratorAction,
  GlassCount,
  OpenDirection,
  ActivePane,
  HandleSide,
  Dimensions,
} from '@/lib/configurator-ferestre/types';
import {
  getNextStep,
  getPreviousStep,
  getResetStateForJump,
} from '@/lib/configurator-ferestre/transitions';
import { calculatePrice } from '@/lib/configurator-ferestre/pricing';

function buildInitialState(product: ProductConfig): ConfiguratorState {
  return {
    product,
    glassCount: null,
    opens: null,
    isOscilo: null,
    openDirection: null,
    activePane: null,
    handleSide: null,
    dimensions: { width: null, height: null },
    selectedGlass: null,
    selectedColor: null,
    selectedHardware: null,
    quantity: 1,
    currentStepId: 'glass-count',
    completedSteps: [],
  };
}

function reducer(
  state: ConfiguratorState,
  action: ConfiguratorAction,
): ConfiguratorState {
  function advance(partial: Partial<ConfiguratorState>): ConfiguratorState {
    const next = { ...state, ...partial };
    return {
      ...next,
      currentStepId: getNextStep(next),
      completedSteps: [...state.completedSteps, state.currentStepId],
    };
  }

  switch (action.type) {
    case 'SET_GLASS_COUNT':
      return advance({ glassCount: action.payload });

    case 'SET_OPENS':
      return advance({ opens: action.payload });

    case 'SET_OSCILO':
      return advance({ isOscilo: action.payload });

    case 'SET_DIRECTION':
      return advance({
        openDirection: action.payload,
        handleSide: action.payload,
      });

    case 'SET_ACTIVE_PANE': {
      const handleSide: HandleSide | null =
        action.payload === 'both' ? null : action.payload;
      return advance({ activePane: action.payload, handleSide });
    }

    case 'SET_HANDLE_SIDE':
      return advance({ handleSide: action.payload });

    case 'SET_DIMENSIONS':
      return {
        ...state,
        dimensions: { ...state.dimensions, ...action.payload },
      };

    case 'SET_GLASS':
      return { ...state, selectedGlass: action.payload };

    case 'SET_COLOR':
      return { ...state, selectedColor: action.payload };

    case 'SET_HARDWARE':
      return { ...state, selectedHardware: action.payload };

    case 'SET_QUANTITY':
      return { ...state, quantity: action.payload };

    case 'GO_BACK': {
      const prev = getPreviousStep(state.completedSteps);
      if (!prev) return state;
      return {
        ...state,
        currentStepId: prev,
        completedSteps: state.completedSteps.slice(0, -1),
      };
    }

    case 'JUMP_TO_STEP': {
      const targetIndex = state.completedSteps.indexOf(action.payload);
      if (targetIndex === -1) return state;
      return {
        ...state,
        ...getResetStateForJump(state, action.payload),
        currentStepId: action.payload,
        completedSteps: state.completedSteps.slice(0, targetIndex),
      };
    }

    default:
      return state;
  }
}

interface Props {
  product: ProductConfig;
}

export function ConfiguratorShell({ product }: Props) {
  const [state, dispatch] = useReducer(reducer, product, buildInitialState);

  const pricing = useMemo(() => {
    if (!state.dimensions.width || !state.dimensions.height) return null;
    return calculatePrice({
      pricePerSquareMeter: state.product.pricePerSquareMeter,
      dimensions: state.dimensions as { width: number; height: number },
      opens: state.opens ?? false,
      isOscilo: state.isOscilo ?? false,
      quantity: state.quantity,
    });
  }, [
    state.dimensions,
    state.opens,
    state.isOscilo,
    state.quantity,
    state.product.pricePerSquareMeter,
  ]);

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-zinc-400 text-sm">
          Step curent: <strong>{state.currentStepId}</strong>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Creează app/configurator/page.tsx**

```tsx
// app/configurator-ferestre/page.tsx
import { MOCK_PRODUCT } from '@/lib/configurator-ferestre/mock-product';
import { ConfiguratorShell } from '@/components/configurator-ferestre/ConfiguratorShell';

export default function ConfiguratorPage() {
  return <ConfiguratorShell product={MOCK_PRODUCT} />;
}
```

- [ ] **Step 3: Pornește dev server și verifică**

```bash
pnpm dev
```

Deschide `http://localhost:3000/configurator`. Trebuie să apară textul "Step curent: glass-count".

- [ ] **Step 4: Verifică TypeScript**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add components/configurator-ferestre/ConfiguratorShell.tsx app/configurator-ferestre/page.tsx
git commit -m "feat: add ConfiguratorShell with useReducer and step machine"
```

---

## Task 6: UI Primitive — BinaryChoice component

**Files:**
- Create: `components/configurator/BinaryChoice.tsx`

- [ ] **Step 1: Creează BinaryChoice.tsx**

```tsx
// components/configurator-ferestre/BinaryChoice.tsx
'use client';

interface Option<T> {
  value: T;
  label: string;
  description?: string;
}

interface BinaryChoiceProps<T> {
  question: string;
  options: [Option<T>, Option<T>];
  onSelect: (value: T) => void;
}

export function BinaryChoice<T>({
  question,
  options,
  onSelect,
}: BinaryChoiceProps<T>) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto px-4">
      <h2 className="text-2xl font-semibold text-zinc-900 text-center">
        {question}
      </h2>
      <div className="flex flex-col md:flex-row w-full gap-4 md:gap-0 rounded-2xl overflow-hidden shadow-sm border border-zinc-200">
        {options.map((opt, i) => (
          <button
            key={String(opt.value)}
            onClick={() => onSelect(opt.value)}
            className={`
              group flex-1 flex flex-col items-center justify-center gap-3
              min-h-[240px] md:min-h-[320px] px-8 py-10
              bg-white hover:bg-amber-50
              transition-all duration-200
              ${i === 0 ? 'md:border-r border-b md:border-b-0 border-zinc-200' : ''}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
            `}
          >
            <span className="text-xl font-semibold text-zinc-900 group-hover:text-amber-800 transition-colors duration-200">
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-sm text-zinc-500 text-center">
                {opt.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/configurator-ferestre/BinaryChoice.tsx
git commit -m "feat: add BinaryChoice shared component"
```

---

## Task 7: Steps — StepGlassCount, StepOpens, StepOscilo

**Files:**
- Create: `components/configurator/steps/StepGlassCount.tsx`
- Create: `components/configurator/steps/StepOpens.tsx`
- Create: `components/configurator/steps/StepOscilo.tsx`

- [ ] **Step 1: Creează StepGlassCount.tsx**

```tsx
// components/configurator-ferestre/steps/StepGlassCount.tsx
'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction, GlassCount } from '@/lib/configurator-ferestre/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepGlassCount({ dispatch }: Props) {
  return (
    <BinaryChoice<GlassCount>
      question="Câte geamuri are fereastra?"
      options={[
        { value: 1, label: '1 geam' },
        { value: 2, label: '2 geamuri' },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_GLASS_COUNT', payload: v })}
    />
  );
}
```

- [ ] **Step 2: Creează StepOpens.tsx**

```tsx
// components/configurator-ferestre/steps/StepOpens.tsx
'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction } from '@/lib/configurator-ferestre/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepOpens({ dispatch }: Props) {
  return (
    <BinaryChoice<boolean>
      question="Fereastra se deschide?"
      options={[
        { value: true, label: 'Da', description: 'Fereastra are mecanism de deschidere' },
        { value: false, label: 'Nu', description: 'Fereastră fixă' },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_OPENS', payload: v })}
    />
  );
}
```

- [ ] **Step 3: Creează StepOscilo.tsx**

```tsx
// components/configurator-ferestre/steps/StepOscilo.tsx
'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction } from '@/lib/configurator-ferestre/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepOscilo({ dispatch }: Props) {
  return (
    <BinaryChoice<boolean>
      question="Deschidere oscilobatantă?"
      options={[
        {
          value: true,
          label: 'Da — oscilobatant',
          description: 'Se deschide lateral și basculează',
        },
        {
          value: false,
          label: 'Nu — deschidere simplă',
          description: 'Se deschide doar lateral',
        },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_OSCILO', payload: v })}
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/configurator-ferestre/steps/StepGlassCount.tsx components/configurator-ferestre/steps/StepOpens.tsx components/configurator-ferestre/steps/StepOscilo.tsx
git commit -m "feat: add StepGlassCount, StepOpens, StepOscilo"
```

---

## Task 8: Steps — StepDirection, StepHandleSide

**Files:**
- Create: `components/configurator/steps/StepDirection.tsx`
- Create: `components/configurator/steps/StepHandleSide.tsx`

- [ ] **Step 1: Creează StepDirection.tsx**

```tsx
// components/configurator-ferestre/steps/StepDirection.tsx
'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction, OpenDirection } from '@/lib/configurator-ferestre/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepDirection({ dispatch }: Props) {
  return (
    <BinaryChoice<OpenDirection>
      question="În ce direcție se deschide fereastra?"
      options={[
        {
          value: 'left',
          label: 'Spre stânga',
          description: 'Mânerul pe partea stângă',
        },
        {
          value: 'right',
          label: 'Spre dreapta',
          description: 'Mânerul pe partea dreaptă',
        },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_DIRECTION', payload: v })}
    />
  );
}
```

- [ ] **Step 2: Creează StepHandleSide.tsx**

```tsx
// components/configurator-ferestre/steps/StepHandleSide.tsx
'use client';

import { BinaryChoice } from '../BinaryChoice';
import type { ConfiguratorAction, HandleSide } from '@/lib/configurator-ferestre/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

export function StepHandleSide({ dispatch }: Props) {
  return (
    <BinaryChoice<HandleSide>
      question="Pe ce geam doriți mânerul?"
      options={[
        {
          value: 'left',
          label: 'Geamul din stânga',
          description: 'Mânerul pe marginea stângă',
        },
        {
          value: 'right',
          label: 'Geamul din dreapta',
          description: 'Mânerul pe marginea dreaptă',
        },
      ]}
      onSelect={(v) => dispatch({ type: 'SET_HANDLE_SIDE', payload: v })}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/configurator-ferestre/steps/StepDirection.tsx components/configurator-ferestre/steps/StepHandleSide.tsx
git commit -m "feat: add StepDirection and StepHandleSide"
```

---

## Task 9: Step — StepActivePane (3 opțiuni)

**Files:**
- Create: `components/configurator/steps/StepActivePane.tsx`

- [ ] **Step 1: Creează StepActivePane.tsx**

```tsx
// components/configurator-ferestre/steps/StepActivePane.tsx
'use client';

import type { ConfiguratorAction, ActivePane } from '@/lib/configurator-ferestre/types';

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

const OPTIONS: { value: ActivePane; label: string; description: string }[] = [
  {
    value: 'left',
    label: 'Geamul din stânga',
    description: 'Mânerul pe geamul stâng',
  },
  {
    value: 'right',
    label: 'Geamul din dreapta',
    description: 'Mânerul pe geamul drept',
  },
  {
    value: 'both',
    label: 'Ambele geamuri',
    description: 'Vei selecta pe care geam e mânerul',
  },
];

export function StepActivePane({ dispatch }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto px-4">
      <h2 className="text-2xl font-semibold text-zinc-900 text-center">
        Ce geam se deschide?
      </h2>
      <div className="flex flex-col md:flex-row w-full gap-4 md:gap-0 rounded-2xl overflow-hidden shadow-sm border border-zinc-200">
        {OPTIONS.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => dispatch({ type: 'SET_ACTIVE_PANE', payload: opt.value })}
            className={`
              group flex-1 flex flex-col items-center justify-center gap-3
              min-h-[240px] md:min-h-[320px] px-6 py-10
              bg-white hover:bg-amber-50
              transition-all duration-200
              ${i < OPTIONS.length - 1 ? 'md:border-r border-b md:border-b-0 border-zinc-200' : ''}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
            `}
          >
            <span className="text-xl font-semibold text-zinc-900 group-hover:text-amber-800 transition-colors duration-200">
              {opt.label}
            </span>
            <span className="text-sm text-zinc-500 text-center">
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/configurator-ferestre/steps/StepActivePane.tsx
git commit -m "feat: add StepActivePane with 3 options"
```

---

## Task 10: Step — StepDimensions

**Files:**
- Create: `components/configurator/steps/StepDimensions.tsx`

- [ ] **Step 1: Creează StepDimensions.tsx**

```tsx
// components/configurator-ferestre/steps/StepDimensions.tsx
'use client';

import type {
  ConfiguratorState,
  ConfiguratorAction,
  GlassCount,
} from '@/lib/configurator-ferestre/types';

const LIMITS = {
  1: { minW: 50, maxW: 150, minH: 40, maxH: 210 },
  2: { minW: 100, maxW: 300, minH: 80, maxH: 420 },
} as const;

interface Props {
  state: ConfiguratorState;
  dispatch: React.Dispatch<ConfiguratorAction>;
  onConfirm: () => void;
}

export function StepDimensions({ state, dispatch, onConfirm }: Props) {
  const glassCount = (state.glassCount ?? 1) as GlassCount;
  const limits = LIMITS[glassCount];
  const { width, height } = state.dimensions;

  const widthValid =
    width !== null && width >= limits.minW && width <= limits.maxW;
  const heightValid =
    height !== null && height >= limits.minH && height <= limits.maxH;
  const canConfirm = widthValid && heightValid;

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-5xl mx-auto gap-8 px-4">
      {/* Form */}
      <div className="flex flex-col gap-6 flex-1">
        <h2 className="text-2xl font-semibold text-zinc-900">
          Dimensiunile golului din perete
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">
              Lățime (cm)
            </span>
            <span className="text-xs text-zinc-400">
              {limits.minW} – {limits.maxW} cm
            </span>
            <input
              type="number"
              min={limits.minW}
              max={limits.maxW}
              step={1}
              value={width ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? null : Number(e.target.value);
                dispatch({ type: 'SET_DIMENSIONS', payload: { width: v } });
              }}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder={`ex. ${Math.round((limits.minW + limits.maxW) / 2)}`}
            />
            {width !== null && !widthValid && (
              <span className="text-xs text-red-500">
                Lățimea trebuie să fie între {limits.minW} și {limits.maxW} cm
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">
              Înălțime (cm)
            </span>
            <span className="text-xs text-zinc-400">
              {limits.minH} – {limits.maxH} cm
            </span>
            <input
              type="number"
              min={limits.minH}
              max={limits.maxH}
              step={1}
              value={height ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? null : Number(e.target.value);
                dispatch({ type: 'SET_DIMENSIONS', payload: { height: v } });
              }}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder={`ex. ${Math.round((limits.minH + limits.maxH) / 2)}`}
            />
            {height !== null && !heightValid && (
              <span className="text-xs text-red-500">
                Înălțimea trebuie să fie între {limits.minH} și {limits.maxH} cm
              </span>
            )}
          </label>
        </div>

        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="mt-2 px-8 py-3 rounded-full bg-stone-800 text-white font-medium
            hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Continuă
        </button>
      </div>

      {/* Preview placeholder — WindowPreview vine în Task 12 */}
      <div className="flex-1 flex items-center justify-center min-h-[300px] lg:min-h-0">
        <div className="w-full max-w-sm aspect-square bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 text-sm">
          Preview fereastră
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/configurator-ferestre/steps/StepDimensions.tsx
git commit -m "feat: add StepDimensions with validation"
```

---

## Task 11: Component — WindowPreview (SVG)

**Files:**
- Create: `components/configurator/WindowPreview.tsx`

- [ ] **Step 1: Creează WindowPreview.tsx**

```tsx
// components/configurator-ferestre/WindowPreview.tsx
'use client';

import type {
  Dimensions,
  GlassCount,
  OpenDirection,
  ActivePane,
  HandleSide,
  OptionItem,
} from '@/lib/configurator-ferestre/types';

const SVG_SIZE = 400;
const PADDING = 32;
const INNER_MAX = SVG_SIZE - PADDING * 2;
const FRAME_SW = 12; // stroke-width for frame

interface Props {
  dimensions: Dimensions;
  glassCount: GlassCount | null;
  opens: boolean | null;
  isOscilo: boolean | null;
  openDirection: OpenDirection | null;
  activePane: ActivePane | null;
  handleSide: HandleSide | null;
  selectedColor: string | null;
  colorOptions: OptionItem[];
}

function scale(value: number, max: number): number {
  return Math.round((value / max) * INNER_MAX);
}

export function WindowPreview({
  dimensions,
  glassCount,
  opens,
  isOscilo,
  openDirection,
  activePane,
  handleSide,
  selectedColor,
  colorOptions,
}: Props) {
  const maxW = glassCount === 2 ? 300 : 150;
  const maxH = glassCount === 2 ? 420 : 210;

  const { width, height } = dimensions;
  const hasWidth = width !== null && width > 0;
  const hasHeight = height !== null && height > 0;

  const frameColor =
    colorOptions.find((o) => o.id === selectedColor)?.colorValue ?? '#8B6914';

  const svgW = hasWidth ? scale(width!, maxW) : 0;
  const svgH = hasHeight ? scale(height!, maxH) : 0;

  const frameX = PADDING + (INNER_MAX - svgW) / 2;
  const frameY = PADDING + (INNER_MAX - svgH) / 2;

  // Pane rects (inner glass area, inside the frame)
  const glassInset = FRAME_SW;
  const paneY = frameY + glassInset;
  const paneH = svgH - glassInset * 2;

  // For 2 panes, split horizontally
  const paneCount = glassCount === 2 ? 2 : 1;
  const dividerX = frameX + svgW / 2;

  function renderOpeningIndicator(
    paneX: number,
    paneW: number,
    isActive: boolean,
    direction: OpenDirection | null,
  ) {
    if (!isActive || !opens || !direction) return null;
    const py = paneY;
    const ph = paneH;
    const px = paneX;
    const pw = paneW;

    // Hinge side is opposite of handle/direction
    // direction 'left' → hinge on right → line from top-right to bottom-left
    // direction 'right' → hinge on left → line from top-left to bottom-right
    const [x1, y1, x2, y2] =
      direction === 'left'
        ? [px + pw, py, px, py + ph]
        : [px, py, px + pw, py + ph];

    if (isOscilo) {
      return (
        <g stroke={frameColor} strokeWidth={1.5} opacity={0.7}>
          {/* Lateral opening */}
          <line x1={x1} y1={y1} x2={x2} y2={y2} />
          {/* Tilt opening (from top-center down) */}
          <line
            x1={px + pw / 2}
            y1={py}
            x2={px + pw / 2}
            y2={py + ph * 0.6}
          />
          <polygon
            points={`${px + pw / 2 - 5},${py + ph * 0.55} ${px + pw / 2},${py + ph * 0.65} ${px + pw / 2 + 5},${py + ph * 0.55}`}
            fill={frameColor}
            stroke="none"
          />
        </g>
      );
    }

    return (
      <g stroke={frameColor} strokeWidth={1.5} opacity={0.7}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} />
      </g>
    );
  }

  function renderHandle(paneX: number, paneW: number, side: HandleSide) {
    const hx = side === 'left' ? paneX + 10 : paneX + paneW - 10;
    const hy = paneY + paneH / 2;
    return (
      <circle
        cx={hx}
        cy={hy}
        r={6}
        fill={frameColor}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  const transitionStyle = 'transition: all 0.2s ease-out;';

  if (!hasWidth) {
    return (
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full h-full"
        aria-label="Previzualizare fereastră"
      >
        <text
          x={SVG_SIZE / 2}
          y={SVG_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-zinc-300 text-sm"
          fontSize={14}
        >
          Introduceți dimensiunile
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full h-full"
      aria-label="Previzualizare fereastră"
    >
      {/* Only width — show a horizontal line */}
      {hasWidth && !hasHeight && (
        <line
          x1={frameX}
          y1={SVG_SIZE / 2}
          x2={frameX + svgW}
          y2={SVG_SIZE / 2}
          stroke={frameColor}
          strokeWidth={FRAME_SW}
          strokeLinecap="round"
          style={{ transition: 'all 0.2s ease-out' }}
        />
      )}

      {/* Full rectangle */}
      {hasWidth && hasHeight && (
        <>
          {/* Outer frame */}
          <rect
            x={frameX}
            y={frameY}
            width={svgW}
            height={svgH}
            fill="none"
            stroke={frameColor}
            strokeWidth={FRAME_SW}
            rx={2}
            style={{ transition: 'all 0.2s ease-out' }}
          />

          {/* Pane(s) */}
          {paneCount === 1 && (
            <>
              <rect
                x={frameX + glassInset}
                y={paneY}
                width={svgW - glassInset * 2}
                height={paneH}
                fill="rgba(186,230,253,0.25)"
                stroke="#cbd5e1"
                strokeWidth={1}
                style={{ transition: 'all 0.2s ease-out' }}
              />
              {renderOpeningIndicator(
                frameX + glassInset,
                svgW - glassInset * 2,
                true,
                openDirection,
              )}
              {handleSide && opens &&
                renderHandle(frameX + glassInset, svgW - glassInset * 2, handleSide)}
            </>
          )}

          {paneCount === 2 && (
            <>
              {/* Divider */}
              <line
                x1={dividerX}
                y1={frameY}
                x2={dividerX}
                y2={frameY + svgH}
                stroke={frameColor}
                strokeWidth={FRAME_SW / 2}
              />

              {/* Left pane */}
              <rect
                x={frameX + glassInset}
                y={paneY}
                width={svgW / 2 - glassInset * 1.5}
                height={paneH}
                fill="rgba(186,230,253,0.25)"
                stroke="#cbd5e1"
                strokeWidth={1}
              />
              {/* Right pane */}
              <rect
                x={dividerX + glassInset / 2}
                y={paneY}
                width={svgW / 2 - glassInset * 1.5}
                height={paneH}
                fill="rgba(186,230,253,0.25)"
                stroke="#cbd5e1"
                strokeWidth={1}
              />

              {/* Opening indicators per active pane */}
              {(activePane === 'left' || activePane === 'both') &&
                renderOpeningIndicator(
                  frameX + glassInset,
                  svgW / 2 - glassInset * 1.5,
                  true,
                  'left',
                )}
              {(activePane === 'right' || activePane === 'both') &&
                renderOpeningIndicator(
                  dividerX + glassInset / 2,
                  svgW / 2 - glassInset * 1.5,
                  true,
                  'right',
                )}

              {/* Handle */}
              {handleSide && opens && (
                <>
                  {handleSide === 'left' &&
                    renderHandle(
                      frameX + glassInset,
                      svgW / 2 - glassInset * 1.5,
                      'left',
                    )}
                  {handleSide === 'right' &&
                    renderHandle(
                      dividerX + glassInset / 2,
                      svgW / 2 - glassInset * 1.5,
                      'right',
                    )}
                </>
              )}
            </>
          )}
        </>
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/configurator-ferestre/WindowPreview.tsx
git commit -m "feat: add WindowPreview SVG component"
```

---

## Task 12: Integrează WindowPreview în StepDimensions

**Files:**
- Modify: `components/configurator/steps/StepDimensions.tsx`

- [ ] **Step 1: Înlocuiește placeholder-ul cu WindowPreview**

Găsește blocul cu placeholder-ul (comentariul `{/* Preview placeholder — WindowPreview vine în Task 12 */}`) și înlocuiește-l:

```tsx
// La începutul fișierului, adaugă importul:
import { WindowPreview } from '../WindowPreview';

// Înlocuiește blocul div cu placeholder:
{/* Înlocuiește: */}
<div className="flex-1 flex items-center justify-center min-h-[300px] lg:min-h-0">
  <div className="w-full max-w-sm aspect-square bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 text-sm">
    Preview fereastră
  </div>
</div>

{/* Cu: */}
<div className="flex-1 flex items-center justify-center min-h-[300px] lg:min-h-0">
  <div className="w-full max-w-sm aspect-square">
    <WindowPreview
      dimensions={state.dimensions}
      glassCount={state.glassCount}
      opens={state.opens}
      isOscilo={state.isOscilo}
      openDirection={state.openDirection}
      activePane={state.activePane}
      handleSide={state.handleSide}
      selectedColor={state.selectedColor}
      colorOptions={state.product.colorOptions}
    />
  </div>
</div>
```

- [ ] **Step 2: Verifică TypeScript**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/configurator-ferestre/steps/StepDimensions.tsx
git commit -m "feat: integrate WindowPreview into StepDimensions"
```

---

## Task 13: Steps — StepConfiguration + PriceSummary

**Files:**
- Create: `components/configurator/PriceSummary.tsx`
- Create: `components/configurator/steps/StepConfiguration.tsx`

- [ ] **Step 1: Creează PriceSummary.tsx**

```tsx
// components/configurator-ferestre/PriceSummary.tsx
'use client';

import type { PricingResult } from '@/lib/configurator-ferestre/types';

interface Props {
  pricing: PricingResult | null;
  quantity: number;
}

export function PriceSummary({ pricing, quantity }: Props) {
  if (!pricing) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
      <div className="flex justify-between text-sm text-zinc-600">
        <span>Suprafață</span>
        <span>{pricing.area} m²</span>
      </div>
      <div className="flex justify-between text-sm text-zinc-600">
        <span>Preț bază</span>
        <span>{pricing.basePrice.toLocaleString('ro-RO')} lei</span>
      </div>
      <div className="flex justify-between text-sm text-zinc-600">
        <span>Preț/buc</span>
        <span className="font-medium">{pricing.unitPrice.toLocaleString('ro-RO')} lei</span>
      </div>
      {quantity > 1 && (
        <div className="flex justify-between text-sm text-zinc-600">
          <span>Cantitate</span>
          <span>× {quantity}</span>
        </div>
      )}
      <div className="border-t border-amber-200 mt-1 pt-2 flex justify-between font-semibold text-zinc-900">
        <span>Total</span>
        <span>{pricing.finalPrice.toLocaleString('ro-RO')} lei</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Creează StepConfiguration.tsx**

```tsx
// components/configurator-ferestre/steps/StepConfiguration.tsx
'use client';

import type {
  ConfiguratorState,
  ConfiguratorAction,
  PricingResult,
} from '@/lib/configurator-ferestre/types';
import { PriceSummary } from '../PriceSummary';

interface Props {
  state: ConfiguratorState;
  dispatch: React.Dispatch<ConfiguratorAction>;
  pricing: PricingResult | null;
  onConfirm: () => void;
}

export function StepConfiguration({ state, dispatch, pricing, onConfirm }: Props) {
  const { product } = state;
  const canConfirm = true; // opțiunile sunt toate opționale; cantitatea e întotdeauna ≥ 1

  return (
    <div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4">
      <h2 className="text-2xl font-semibold text-zinc-900">Configurați fereastra</h2>

      <div className="flex flex-col gap-5">
        {/* Sticlă */}
        {product.glassOptions.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">Sticlă</span>
            <select
              value={state.selectedGlass ?? ''}
              onChange={(e) =>
                dispatch({ type: 'SET_GLASS', payload: e.target.value })
              }
              className="rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 bg-white
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Alege tipul de sticlă...</option>
              {product.glassOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                  {o.priceModifier ? ` (+${o.priceModifier} lei/m²)` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Culoare */}
        {product.colorOptions.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">Culoare</span>
            <select
              value={state.selectedColor ?? ''}
              onChange={(e) =>
                dispatch({ type: 'SET_COLOR', payload: e.target.value })
              }
              className="rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 bg-white
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Alege culoarea...</option>
              {product.colorOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                  {o.priceModifier ? ` (+${o.priceModifier} lei/m²)` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Feronerie */}
        {product.hardwareOptions.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">Feronerie</span>
            <select
              value={state.selectedHardware ?? ''}
              onChange={(e) =>
                dispatch({ type: 'SET_HARDWARE', payload: e.target.value })
              }
              className="rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 bg-white
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Alege feroneria...</option>
              {product.hardwareOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                  {o.priceModifier ? ` (+${o.priceModifier} lei/buc)` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Cantitate */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">Cantitate</span>
          <input
            type="number"
            min={1}
            step={1}
            value={state.quantity}
            onChange={(e) => {
              const v = Math.max(1, Math.floor(Number(e.target.value)));
              dispatch({ type: 'SET_QUANTITY', payload: v });
            }}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-32"
          />
        </label>
      </div>

      <PriceSummary pricing={pricing} quantity={state.quantity} />

      <button
        onClick={onConfirm}
        className="px-8 py-3 rounded-full bg-stone-800 text-white font-medium
          hover:bg-stone-700 transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        Vezi sumar
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/configurator-ferestre/PriceSummary.tsx components/configurator-ferestre/steps/StepConfiguration.tsx
git commit -m "feat: add StepConfiguration and PriceSummary"
```

---

## Task 14: Step — StepSummary

**Files:**
- Create: `components/configurator/steps/StepSummary.tsx`

- [ ] **Step 1: Creează StepSummary.tsx**

```tsx
// components/configurator-ferestre/steps/StepSummary.tsx
'use client';

import type {
  ConfiguratorState,
  ConfiguratorOutput,
  PricingResult,
  OptionItem,
} from '@/lib/configurator-ferestre/types';
import { PriceSummary } from '../PriceSummary';

interface Props {
  state: ConfiguratorState;
  pricing: PricingResult | null;
  onSubmit: (output: ConfiguratorOutput) => void;
}

function findOption(options: OptionItem[], id: string | null): OptionItem | null {
  if (!id) return null;
  return options.find((o) => o.id === id) ?? null;
}

export function StepSummary({ state, pricing, onSubmit }: Props) {
  function buildOutput(): ConfiguratorOutput | null {
    if (
      !state.glassCount ||
      state.opens === null ||
      state.isOscilo === null ||
      !state.dimensions.width ||
      !state.dimensions.height ||
      !pricing
    )
      return null;

    return {
      productId: state.product.productId,
      configuration: {
        glassCount: state.glassCount,
        opens: state.opens,
        isOscilo: state.isOscilo,
        openDirection: state.openDirection,
        activePane: state.activePane,
        handleSide: state.handleSide,
        dimensions: {
          width: state.dimensions.width,
          height: state.dimensions.height,
        },
        glass: findOption(state.product.glassOptions, state.selectedGlass),
        color: findOption(state.product.colorOptions, state.selectedColor),
        hardware: findOption(state.product.hardwareOptions, state.selectedHardware),
        quantity: state.quantity,
      },
      pricing: {
        pricePerSqm: state.product.pricePerSquareMeter,
        area: pricing.area,
        basePrice: pricing.basePrice,
        unitPrice: pricing.unitPrice,
        finalPrice: pricing.finalPrice,
      },
    };
  }

  const output = buildOutput();

  const rows: [string, string][] = [
    ['Produs', state.product.productName],
    ['Geamuri', String(state.glassCount)],
    ['Deschidere', state.opens ? (state.isOscilo ? 'Oscilobatant' : 'Da') : 'Fixă'],
    ...(state.openDirection
      ? [['Direcție', state.openDirection === 'left' ? 'Stânga' : 'Dreapta'] as [string, string]]
      : []),
    [
      'Dimensiuni',
      `${state.dimensions.width} × ${state.dimensions.height} cm`,
    ],
    ...(state.selectedGlass
      ? [['Sticlă', findOption(state.product.glassOptions, state.selectedGlass)?.label ?? ''] as [string, string]]
      : []),
    ...(state.selectedColor
      ? [['Culoare', findOption(state.product.colorOptions, state.selectedColor)?.label ?? ''] as [string, string]]
      : []),
    ...(state.selectedHardware
      ? [['Feronerie', findOption(state.product.hardwareOptions, state.selectedHardware)?.label ?? ''] as [string, string]]
      : []),
    ['Cantitate', String(state.quantity)],
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto px-4">
      <h2 className="text-2xl font-semibold text-zinc-900">Sumar configurație</h2>

      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between px-4 py-3 even:bg-zinc-50 text-sm"
          >
            <span className="text-zinc-500">{label}</span>
            <span className="text-zinc-900 font-medium">{value}</span>
          </div>
        ))}
      </div>

      <PriceSummary pricing={pricing} quantity={state.quantity} />

      {/* Output JSON (vizibil în dev pentru testare) */}
      {process.env.NODE_ENV === 'development' && output && (
        <details className="rounded-lg border border-zinc-200 text-xs">
          <summary className="px-4 py-2 cursor-pointer text-zinc-500 hover:text-zinc-700">
            JSON output (dev)
          </summary>
          <pre className="px-4 py-3 bg-zinc-50 overflow-auto">
            {JSON.stringify(output, null, 2)}
          </pre>
        </details>
      )}

      <button
        disabled={!output}
        onClick={() => output && onSubmit(output)}
        className="px-8 py-3 rounded-full bg-amber-700 text-white font-medium
          hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        Trimite configurația
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/configurator-ferestre/steps/StepSummary.tsx
git commit -m "feat: add StepSummary with output JSON"
```

---

## Task 15: Component — StepHistory

**Files:**
- Create: `components/configurator/StepHistory.tsx`

- [ ] **Step 1: Creează StepHistory.tsx**

```tsx
// components/configurator-ferestre/StepHistory.tsx
'use client';

import { STEPS } from '@/lib/configurator-ferestre/steps';
import type { ConfiguratorAction, StepId } from '@/lib/configurator-ferestre/types';

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
```

- [ ] **Step 2: Commit**

```bash
git add components/configurator-ferestre/StepHistory.tsx
git commit -m "feat: add StepHistory navigation bar"
```

---

## Task 16: Wire — ConfiguratorShell complet

**Files:**
- Modify: `components/configurator/ConfiguratorShell.tsx`

- [ ] **Step 1: Înlocuiește conținutul ConfiguratorShell.tsx cu versiunea completă**

```tsx
// components/configurator-ferestre/ConfiguratorShell.tsx
'use client';

import { useReducer, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  ProductConfig,
  ConfiguratorState,
  ConfiguratorAction,
  HandleSide,
  ConfiguratorOutput,
  PricingResult,
} from '@/lib/configurator-ferestre/types';
import {
  getNextStep,
  getPreviousStep,
  getResetStateForJump,
} from '@/lib/configurator-ferestre/transitions';
import { calculatePrice } from '@/lib/configurator-ferestre/pricing';
import { StepHistory } from './StepHistory';
import { StepGlassCount } from './steps/StepGlassCount';
import { StepOpens } from './steps/StepOpens';
import { StepOscilo } from './steps/StepOscilo';
import { StepDirection } from './steps/StepDirection';
import { StepActivePane } from './steps/StepActivePane';
import { StepHandleSide } from './steps/StepHandleSide';
import { StepDimensions } from './steps/StepDimensions';
import { StepConfiguration } from './steps/StepConfiguration';
import { StepSummary } from './steps/StepSummary';

function buildInitialState(product: ProductConfig): ConfiguratorState {
  return {
    product,
    glassCount: null,
    opens: null,
    isOscilo: null,
    openDirection: null,
    activePane: null,
    handleSide: null,
    dimensions: { width: null, height: null },
    selectedGlass: null,
    selectedColor: null,
    selectedHardware: null,
    quantity: 1,
    currentStepId: 'glass-count',
    completedSteps: [],
  };
}

function reducer(
  state: ConfiguratorState,
  action: ConfiguratorAction,
): ConfiguratorState {
  function advance(partial: Partial<ConfiguratorState>): ConfiguratorState {
    const next = { ...state, ...partial };
    return {
      ...next,
      currentStepId: getNextStep(next),
      completedSteps: [...state.completedSteps, state.currentStepId],
    };
  }

  switch (action.type) {
    case 'SET_GLASS_COUNT':
      return advance({ glassCount: action.payload });
    case 'SET_OPENS':
      return advance({ opens: action.payload });
    case 'SET_OSCILO':
      return advance({ isOscilo: action.payload });
    case 'SET_DIRECTION':
      return advance({
        openDirection: action.payload,
        handleSide: action.payload,
      });
    case 'SET_ACTIVE_PANE': {
      const handleSide: HandleSide | null =
        action.payload === 'both' ? null : action.payload;
      return advance({ activePane: action.payload, handleSide });
    }
    case 'SET_HANDLE_SIDE':
      return advance({ handleSide: action.payload });
    case 'SET_DIMENSIONS':
      return {
        ...state,
        dimensions: { ...state.dimensions, ...action.payload },
      };
    case 'SET_GLASS':
      return { ...state, selectedGlass: action.payload };
    case 'SET_COLOR':
      return { ...state, selectedColor: action.payload };
    case 'SET_HARDWARE':
      return { ...state, selectedHardware: action.payload };
    case 'SET_QUANTITY':
      return { ...state, quantity: action.payload };
    case 'GO_BACK': {
      const prev = getPreviousStep(state.completedSteps);
      if (!prev) return state;
      return {
        ...state,
        currentStepId: prev,
        completedSteps: state.completedSteps.slice(0, -1),
      };
    }
    case 'JUMP_TO_STEP': {
      const targetIndex = state.completedSteps.indexOf(action.payload);
      if (targetIndex === -1) return state;
      return {
        ...state,
        ...getResetStateForJump(state, action.payload),
        currentStepId: action.payload,
        completedSteps: state.completedSteps.slice(0, targetIndex),
      };
    }
    default:
      return state;
  }
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

interface Props {
  product: ProductConfig;
}

export function ConfiguratorShell({ product }: Props) {
  const [state, dispatch] = useReducer(reducer, product, buildInitialState);

  const pricing = useMemo<PricingResult | null>(() => {
    if (!state.dimensions.width || !state.dimensions.height) return null;
    return calculatePrice({
      pricePerSquareMeter: state.product.pricePerSquareMeter,
      dimensions: state.dimensions as { width: number; height: number },
      opens: state.opens ?? false,
      isOscilo: state.isOscilo ?? false,
      quantity: state.quantity,
    });
  }, [
    state.dimensions,
    state.opens,
    state.isOscilo,
    state.quantity,
    state.product.pricePerSquareMeter,
  ]);

  const advanceDimensions = useCallback(() => {
    dispatch({ type: 'JUMP_TO_STEP', payload: 'configuration' });
    // Actually we just advance: dispatch a synthetic action
    // We advance by dispatching a no-op that moves to next step
    // Instead use SET_DIMENSIONS with current values to trigger advance
    // NOTE: dimensions are already set; we need to advance manually
    // We use GO_BACK trick or a dedicated ADVANCE action.
    // Simpler: add ADVANCE_FROM_DIMENSIONS action or reuse existing flow.
    // Correct approach: dispatch SET_DIMENSIONS with current values but that
    // doesn't advance. We need an explicit CONFIRM_DIMENSIONS action.
  }, []);

  // NOTE: StepDimensions and StepConfiguration use an onConfirm callback
  // that simply advances to the next step. We implement this with a dedicated action.
  // Add CONFIRM_STEP action to the reducer — dispatches advance with no changes.
  function handleConfirmDimensions() {
    // We advance by updating completedSteps manually via GO_BACK + re-advance
    // Cleanest: dispatch a confirm action. For now, use a direct state mutation via
    // a dedicated dispatch that we'll handle in the reducer.
    // Solution: add 'ADVANCE' to ConfiguratorAction in types.ts and handle it.
    // Implement inline for now: re-dispatch dimensions to trigger advance.
    if (state.dimensions.width && state.dimensions.height) {
      // Re-set dimensions to trigger the advance path
      // This won't work as SET_DIMENSIONS doesn't advance.
      // We need the ADVANCE action. Add it below.
    }
  }

  // IMPORTANT: Before running this task, add 'ADVANCE' to ConfiguratorAction
  // in types.ts and add a case in reducer that calls advance({}).
  // See Step 2 below.

  function renderStep() {
    const { currentStepId } = state;
    switch (currentStepId) {
      case 'glass-count':
        return <StepGlassCount dispatch={dispatch} />;
      case 'opens':
        return <StepOpens dispatch={dispatch} />;
      case 'oscilo':
        return <StepOscilo dispatch={dispatch} />;
      case 'direction':
        return <StepDirection dispatch={dispatch} />;
      case 'active-pane':
        return <StepActivePane dispatch={dispatch} />;
      case 'handle-side':
        return <StepHandleSide dispatch={dispatch} />;
      case 'dimensions':
        return (
          <StepDimensions
            state={state}
            dispatch={dispatch}
            onConfirm={() => dispatch({ type: 'ADVANCE' })}
          />
        );
      case 'configuration':
        return (
          <StepConfiguration
            state={state}
            dispatch={dispatch}
            pricing={pricing}
            onConfirm={() => dispatch({ type: 'ADVANCE' })}
          />
        );
      case 'summary':
        return (
          <StepSummary
            state={state}
            pricing={pricing}
            onSubmit={(output) => {
              console.log('Output JSON:', JSON.stringify(output, null, 2));
              // TODO: transmite output la WordPress
            }}
          />
        );
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <StepHistory
        completedSteps={state.completedSteps}
        currentStepId={state.currentStepId}
        dispatch={dispatch}
      />
      <div className="flex-1 flex items-center justify-center overflow-auto py-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.currentStepId}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Adaugă `ADVANCE` în types.ts**

Deschide `lib/configurator/types.ts` și adaugă la `ConfiguratorAction`:

```typescript
// Adaugă această linie în uniunea ConfiguratorAction:
| { type: 'ADVANCE' }
```

- [ ] **Step 3: Adaugă case ADVANCE în reducer (în ConfiguratorShell.tsx)**

Adaugă înainte de `default:`:

```typescript
case 'ADVANCE':
  return advance({});
```

- [ ] **Step 4: Elimină funcțiile neutilizate din ConfiguratorShell**

Șterge `advanceDimensions`, `handleConfirmDimensions` și comentariile NOTE din Task 16 Step 1 — erau note de planificare, nu cod final.

- [ ] **Step 5: Verifică TypeScript**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Pornește dev server și parcurge tot fluxul**

```bash
pnpm dev
```

Verifică în browser `http://localhost:3000/configurator`:
- [ ] Pasul 1 apare corect (1 geam / 2 geamuri)
- [ ] Selectând 1 geam → apare pasul Deschidere
- [ ] Selectând Da → apare Oscilobatant
- [ ] Selectând Nu la deschidere → sare direct la Dimensiuni
- [ ] StepHistory arată pașii parcurși și permite navigare înapoi
- [ ] Dimensiunile se validează corect (min/max)
- [ ] Preview-ul SVG crește live pe măsură ce introduci dimensiunile
- [ ] Configurația are dropdown-uri pentru sticlă, culoare, feronerie
- [ ] Sumarul afișează toate opțiunile + prețul calculat
- [ ] JSON output apare în secțiunea dev din Summary

- [ ] **Step 7: Commit**

```bash
git add components/configurator-ferestre/ConfiguratorShell.tsx lib/configurator-ferestre/types.ts
git commit -m "feat: wire all steps in ConfiguratorShell with Framer Motion transitions"
```

---

## Task 17: Finalizare — app/page.tsx + metadata

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Actualizează app/page.tsx**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/configurator');
}
```

- [ ] **Step 2: Actualizează metadata în app/layout.tsx**

Înlocuiește blocul `export const metadata`:

```typescript
export const metadata: Metadata = {
  title: 'Configurator Ferestre din Lemn',
  description: 'Configurați și calculați prețul ferestrei dvs. personalizate',
};
```

- [ ] **Step 3: Build final de verificare**

```bash
pnpm build
```

Expected: build reușit fără erori TypeScript sau ESLint bloquante.

- [ ] **Step 4: Commit final**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: redirect home to configurator, update metadata"
```

---

## Self-Review

### Spec coverage

| Cerință spec | Acoperit în |
|---|---|
| Stepper dinamic, fără pași viitori | Task 15 — StepHistory afișează doar `completedSteps` + `currentStepId` |
| Flux 1 geam (fix / deschidere / oscilobatant) | Task 3 — `steps.ts` noduri + Task 7-8 |
| Flux 2 geamuri (stânga / dreapta / ambele) | Task 9 — StepActivePane + Task 8 — StepHandleSide |
| Reprezentare SVG live | Task 11 — WindowPreview, integrat în Task 12 |
| SVG: linie → dreptunghi progresiv | Task 11 — condiție `hasWidth && !hasHeight` |
| SVG: direcție deschidere + mâner | Task 11 — `renderOpeningIndicator` + `renderHandle` |
| SVG: oscilobatant vizual distinct | Task 11 — `isOscilo` branch cu 2 linii |
| Motor preț (fix / deschidere / oscilobatant) | Task 4 — `pricing.ts` |
| Calcul live în timp real | Task 16 — `useMemo` în ConfiguratorShell |
| Dropdown dinamic din JSON | Task 13 — StepConfiguration, array-uri filtrate |
| Dropdown absent dacă array gol | Task 13 — condiție `options.length > 0` |
| Cantitate minim 1, întreg | Task 13 — `Math.max(1, Math.floor(...))` |
| Animații slide între pași | Task 16 — `AnimatePresence` + `motion.div` |
| Output JSON complet | Task 14 — `buildOutput()` în StepSummary |
| Input dimensiuni cu min/max | Task 10 — `LIMITS` + validare inline |
| Mock product pentru testare | Task 4 — `mock-product.ts` |
| Navigare înapoi (GO_BACK + JUMP_TO_STEP) | Task 5 + Task 15 |
| Resetare stare la jump | Task 3 — `getResetStateForJump` |
| `handleSide` derivat automat | Task 5 — cazuri `SET_DIRECTION` și `SET_ACTIVE_PANE` |

Toate cerințele din spec sunt acoperite.
