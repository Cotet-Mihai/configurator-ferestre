'use client';

import { useReducer, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  ProductConfig,
  ConfiguratorState,
  ConfiguratorAction,
  HandleSide,
  PricingResult,
  ConfiguratorOutput,
} from '@/lib/configurator/types';
import {
  getNextStep,
  getPreviousStep,
  getResetStateForJump,
} from '@/lib/configurator/transitions';
import { calculatePrice } from '@/lib/configurator/pricing';
import { StepHistory } from './StepHistory';
import { StepGlassCount } from './steps/StepGlassCount';
import { StepOpens } from './steps/StepOpens';
import { StepOscilo } from './steps/StepOscilo';
import { StepDirection } from './steps/StepDirection';
import { StepActivePane } from './steps/StepActivePane';
import { StepHandleSide } from './steps/StepHandleSide';
import { StepDimensions } from './steps/StepDimensions';
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
    selectedGlass: product.glassOptions[0]?.id ?? null,
    selectedColor: product.colorOptions[0]?.id ?? null,
    selectedHardware: product.hardwareOptions[0]?.id ?? null,
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
    case 'ADVANCE':
      return advance({});
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

    const glassModifier =
      state.product.glassOptions.find((o) => o.id === state.selectedGlass)
        ?.priceModifier ?? 0;
    const colorModifier =
      state.product.colorOptions.find((o) => o.id === state.selectedColor)
        ?.priceModifier ?? 0;
    const hardwareModifier =
      state.product.hardwareOptions.find((o) => o.id === state.selectedHardware)
        ?.priceModifier ?? 0;

    return calculatePrice({
      pricePerSquareMeter: state.product.pricePerSquareMeter,
      dimensions: state.dimensions as { width: number; height: number },
      opens: state.opens ?? false,
      isOscilo: state.isOscilo ?? false,
      quantity: state.quantity,
      optionModifiers: glassModifier + colorModifier,
      hardwareFlatModifier: hardwareModifier,
      // La 2 geamuri cu deschidere doar pe un geam (stânga/dreapta), suplimentul
      // de deschidere se înjumătățește. La „ambele" sau 1 geam rămâne întreg.
      openingShare:
        state.glassCount === 2 &&
        (state.activePane === 'left' || state.activePane === 'right')
          ? 0.5
          : 1,
    });
  }, [
    state.dimensions,
    state.opens,
    state.isOscilo,
    state.glassCount,
    state.activePane,
    state.quantity,
    state.product.pricePerSquareMeter,
    state.selectedGlass,
    state.selectedColor,
    state.selectedHardware,
    state.product.glassOptions,
    state.product.colorOptions,
    state.product.hardwareOptions,
  ]);

  function handleSubmit(output: ConfiguratorOutput) {
    if (window.parent !== window) {
      // Rulează în iframe WordPress – trimite outputul prin postMessage
      window.parent.postMessage({ type: 'TC_CONFIGURATOR_OUTPUT', payload: output }, '*');
    } else {
      // Standalone (dev / preview direct în browser)
      console.log('Configurator output:', JSON.stringify(output, null, 2));
    }
  }

  function renderStep() {
    switch (state.currentStepId) {
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
            pricing={pricing}
            onConfirm={() => dispatch({ type: 'ADVANCE' })}
          />
        );
      case 'summary':
        return (
          <StepSummary
            state={state}
            pricing={pricing}
            onSubmit={handleSubmit}
            onBack={() => dispatch({ type: 'GO_BACK' })}
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
      <div className="flex-1 overflow-auto">
        <div className="min-h-full flex items-center justify-center py-8">
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
    </div>
  );
}
