'use client';

import type {
  ConfiguratorState,
  ConfiguratorOutput,
  PricingResult,
  OptionItem,
} from '@/lib/configurator/types';
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

  const labelMap: Record<string, string> = {
    left: 'Stânga',
    right: 'Dreapta',
    both: 'Ambele',
  };

  const rows: [string, string][] = [
    ['Produs', state.product.productName],
    ['Geamuri', String(state.glassCount)],
    [
      'Deschidere',
      state.opens ? (state.isOscilo ? 'Oscilobatant' : 'Da') : 'Fixă',
    ],
    ...(state.openDirection
      ? ([['Direcție', labelMap[state.openDirection]]] as [string, string][])
      : []),
    ...(state.activePane
      ? ([['Geam activ', labelMap[state.activePane]]] as [string, string][])
      : []),
    [
      'Dimensiuni',
      `${state.dimensions.width} × ${state.dimensions.height} cm`,
    ],
    ...(state.selectedGlass
      ? ([
          [
            'Sticlă',
            findOption(state.product.glassOptions, state.selectedGlass)?.label ??
              '',
          ],
        ] as [string, string][])
      : []),
    ...(state.selectedColor
      ? ([
          [
            'Culoare',
            findOption(state.product.colorOptions, state.selectedColor)?.label ??
              '',
          ],
        ] as [string, string][])
      : []),
    ...(state.selectedHardware
      ? ([
          [
            'Feronerie',
            findOption(
              state.product.hardwareOptions,
              state.selectedHardware,
            )?.label ?? '',
          ],
        ] as [string, string][])
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

      {/* Output JSON visible in dev mode for testing */}
      {process.env.NODE_ENV === 'development' && output && (
        <details className="rounded-lg border border-zinc-200 text-xs">
          <summary className="px-4 py-2 cursor-pointer text-zinc-500 hover:text-zinc-700">
            JSON output (dev)
          </summary>
          <pre className="px-4 py-3 bg-zinc-900 text-emerald-400 overflow-auto">
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
