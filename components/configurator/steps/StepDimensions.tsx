'use client';

import type {
  ConfiguratorState,
  ConfiguratorAction,
  GlassCount,
} from '@/lib/configurator/types';
import { WindowPreview } from '../WindowPreview';

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
    </div>
  );
}
