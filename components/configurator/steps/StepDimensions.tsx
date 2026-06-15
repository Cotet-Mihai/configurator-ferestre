'use client';

import { useState, useEffect } from 'react';
import type {
  ConfiguratorState,
  ConfiguratorAction,
  PricingResult,
  Dimensions,
} from '@/lib/configurator/types';
import { getDimensionLimits } from '@/lib/configurator/limits';
import { WindowPreview } from '../WindowPreview';

interface Props {
  state: ConfiguratorState;
  dispatch: React.Dispatch<ConfiguratorAction>;
  pricing: PricingResult | null;
  onConfirm: () => void;
}

export function StepDimensions({ state, dispatch, pricing, onConfirm }: Props) {
  const limits = getDimensionLimits(state.glassCount, state.opens, state.activePane);
  const { width, height } = state.dimensions;

  const widthValid =
    width !== null && width >= limits.minW && width <= limits.maxW;
  const heightValid =
    height !== null && height >= limits.minH && height <= limits.maxH;
  const canConfirm = widthValid && heightValid;

  const previewDimensions: Dimensions = { width, height };

  const [debouncedPreview, setDebouncedPreview] = useState<Dimensions>(previewDimensions);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPreview(previewDimensions), 500);
    return () => clearTimeout(t);
  }, [previewDimensions.width, previewDimensions.height]);

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-5xl mx-auto gap-8 px-4">
      {/* Form */}
      <div className="flex flex-col gap-0 flex-1">

        <h2 className="text-2xl font-semibold text-zinc-900 mb-6">
          Configurați fereastra
        </h2>

        {/* Secțiunea 1 — Dimensiuni gol */}
        <div className="flex flex-col gap-4 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Dimensiuni gol
          </p>

          <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">
              Lățime gol (cm)
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
              Înălțime gol (cm)
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
        </div>

        {/* Separator */}
        <div className="border-t border-zinc-200 mb-6" />

        {/* Secțiunea 2 — Specificații produs */}
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Specificații produs
          </p>

        {/* Sticlă */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">Sticlă</span>
          {state.product.glassOptions.length <= 1 ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-500 cursor-default select-none">
              {state.product.glassOptions[0]?.label ?? '—'}
            </div>
          ) : (
            <select
              value={state.selectedGlass ?? ''}
              onChange={(e) => dispatch({ type: 'SET_GLASS', payload: e.target.value })}
              className="rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {state.product.glassOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}{opt.priceModifier ? ` (+${opt.priceModifier} lei/m²)` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Feronerie */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700">Feronerie</span>
          {state.product.hardwareOptions.length <= 1 ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-500 cursor-default select-none">
              {state.product.hardwareOptions[0]?.label ?? '—'}
            </div>
          ) : (
            <select
              value={state.selectedHardware ?? ''}
              onChange={(e) => dispatch({ type: 'SET_HARDWARE', payload: e.target.value })}
              className="rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {state.product.hardwareOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}{opt.priceModifier ? ` (+${opt.priceModifier} lei/buc)` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Culoare */}
        {state.product.colorOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700">Culoare</span>
            <div className="flex flex-wrap gap-3">
              {state.product.colorOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.label}
                  onClick={() => dispatch({ type: 'SET_COLOR', payload: opt.id })}
                  className={`
                    flex flex-col items-center gap-1.5 group
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl
                  `}
                >
                  <span
                    className={`
                      w-10 h-10 rounded-full border-2 transition-all duration-150
                      ${state.selectedColor === opt.id
                        ? 'border-amber-500 scale-110 shadow-md'
                        : 'border-zinc-300 group-hover:border-zinc-400'}
                    `}
                    style={{ backgroundColor: opt.colorValue ?? '#8B6914' }}
                  />
                  <span className="text-xs text-zinc-500 max-w-[56px] text-center leading-tight">
                    {opt.label}
                  </span>
                  <span className={`text-xs font-medium leading-tight ${opt.priceModifier ? 'text-amber-700' : 'text-zinc-400'}`}>
                    {opt.priceModifier ? `+${opt.priceModifier} lei/m²` : 'Inclus'}
                  </span>
                </button>
              ))}
            </div>
          </div>
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
              const parsed = Number(e.target.value);
              const v = Number.isNaN(parsed) ? 1 : Math.max(1, Math.floor(parsed));
              dispatch({ type: 'SET_QUANTITY', payload: v });
            }}
            className="rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-32"
          />
        </label>

        </div>

        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="mt-6 px-8 py-3 rounded-full bg-stone-800 text-white font-medium
            hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Vezi sumar
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[300px] lg:min-h-0">
        <div className="w-full max-w-sm aspect-square">
          <WindowPreview
            dimensions={debouncedPreview}
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
