'use client';

import type {
  ConfiguratorState,
  ConfiguratorAction,
  PricingResult,
} from '@/lib/configurator/types';
import { PriceSummary } from '../PriceSummary';

interface Props {
  state: ConfiguratorState;
  dispatch: React.Dispatch<ConfiguratorAction>;
  pricing: PricingResult | null;
  onConfirm: () => void;
}

export function StepConfiguration({ state, dispatch, pricing, onConfirm }: Props) {
  const { product } = state;

  return (
    <div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-4">
      <h2 className="text-2xl font-semibold text-zinc-900">Configurați fereastra</h2>

      <div className="flex flex-col gap-5">
        {/* Sticlă — only shown if glassOptions is non-empty */}
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

        {/* Culoare — only shown if colorOptions is non-empty */}
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

        {/* Feronerie — only shown if hardwareOptions is non-empty */}
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

        {/* Cantitate — always shown */}
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
