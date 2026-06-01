'use client';

import { useReducer, useMemo } from 'react';
import type {
  ProductConfig,
  ConfiguratorState,
  ConfiguratorAction,
  HandleSide,
  PricingResult,
} from '@/lib/configurator/types';
import {
  getNextStep,
  getPreviousStep,
  getResetStateForJump,
} from '@/lib/configurator/transitions';
import { calculatePrice } from '@/lib/configurator/pricing';

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
