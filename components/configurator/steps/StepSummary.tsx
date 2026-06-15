'use client';

import type {
  ConfiguratorState,
  ConfiguratorOutput,
  PricingResult,
  OptionItem,
} from '@/lib/configurator/types';

interface Props {
  state: ConfiguratorState;
  pricing: PricingResult | null;
  onSubmit: (output: ConfiguratorOutput) => void;
  onBack: () => void;
}

function findOption(options: OptionItem[], id: string | null): OptionItem | null {
  if (!id) return null;
  return options.find((o) => o.id === id) ?? null;
}

function fmt(n: number): string {
  return n.toLocaleString('ro-RO') + ' lei';
}

const dirLabel: Record<string, string> = {
  left: 'Stânga',
  right: 'Dreapta',
  both: 'Ambele',
};

export function StepSummary({ state, pricing, onSubmit, onBack }: Props) {
  const { product } = state;

  const glass    = findOption(product.glassOptions,    state.selectedGlass);
  const color    = findOption(product.colorOptions,    state.selectedColor);
  const hardware = findOption(product.hardwareOptions, state.selectedHardware);

  const multiplier = state.isOscilo ? 1.6 : state.opens ? 1.5 : 1.0;
  const multiplierLabel = state.isOscilo ? 'Oscilobatant' : state.opens ? 'Cu deschidere' : 'Fixă';

  function buildOutput(): ConfiguratorOutput | null {
    if (
      !state.glassCount ||
      state.opens === null ||
      state.isOscilo === null ||
      !state.dimensions.width ||
      !state.dimensions.height ||
      !pricing
    ) return null;

    return {
      productId: product.productId,
      configuration: {
        glassCount: state.glassCount,
        opens: state.opens,
        isOscilo: state.isOscilo,
        openDirection: state.openDirection,
        activePane: state.activePane,
        handleSide: state.handleSide,
        dimensions: { width: state.dimensions.width, height: state.dimensions.height },
        glass, color, hardware,
        quantity: state.quantity,
      },
      pricing: {
        pricePerSqm: product.pricePerSquareMeter,
        area: pricing.area,
        basePrice: pricing.basePrice,
        unitPrice: pricing.unitPrice,
        finalPrice: pricing.finalPrice,
      },
    };
  }

  const output = buildOutput();

  // ── Rânduri configurație ─────────────────────────────
  const rows: { label: string; value: string; colorDot?: string }[] = [
    { label: 'Produs', value: product.productName },
    { label: 'Geamuri', value: String(state.glassCount) },
    { label: 'Deschidere', value: multiplierLabel },
  ];
  if (state.openDirection) rows.push({ label: 'Direcție deschidere', value: dirLabel[state.openDirection] });
  if (state.activePane) rows.push({ label: 'Geam activ', value: dirLabel[state.activePane] });
  rows.push({ label: 'Lățime gol', value: `${state.dimensions.width} cm` });
  rows.push({ label: 'Înălțime gol', value: `${state.dimensions.height} cm` });
  if (glass) rows.push({ label: 'Sticlă', value: glass.label });
  if (color) rows.push({ label: 'Culoare', value: color.label, colorDot: color.colorValue });
  if (hardware) rows.push({ label: 'Feronerie', value: hardware.label });
  rows.push({ label: 'Cantitate', value: String(state.quantity) });

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto px-4 pb-8">
      <h2 className="text-2xl font-semibold text-zinc-900">Sumar configurație</h2>

      {/* Tabel configurație */}
      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        {rows.map(({ label, value, colorDot }) => (
          <div
            key={label}
            className="flex justify-between items-center px-4 py-3 even:bg-zinc-50 text-sm gap-4"
          >
            <span className="text-zinc-500">{label}</span>
            <span className="text-zinc-900 font-medium flex items-center gap-1.5 text-right">
              {colorDot && (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block flex-shrink-0"
                  style={{ backgroundColor: colorDot }}
                />
              )}
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Detaliu preț */}
      {pricing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Detaliu preț</p>

          <Row label="Preț de bază" value={`${product.pricePerSquareMeter.toLocaleString('ro-RO')} lei/m²`} />

          {glass && glass.priceModifier ? (
            <Row label={`Sticlă (${glass.label})`} value={`+${glass.priceModifier.toLocaleString('ro-RO')} lei/m²`} />
          ) : null}

          {color && color.priceModifier ? (
            <Row label={`Culoare (${color.label})`} value={`+${color.priceModifier.toLocaleString('ro-RO')} lei/m²`} />
          ) : null}

          <Row label={`Preț efectiv × ${pricing.area} m²`} value={fmt(pricing.basePrice)} strong />

          {multiplier > 1 && (
            <Row
              label={`Tip deschidere (${multiplierLabel})`}
              value={`+${fmt(pricing.unitPrice - (hardware?.priceModifier ?? 0) - pricing.basePrice)}`}
            />
          )}

          {hardware && hardware.priceModifier ? (
            <Row label={`Feronerie (${hardware.label})`} value={`+${hardware.priceModifier.toLocaleString('ro-RO')} lei/buc`} />
          ) : null}

          <Row label="Preț per bucată" value={fmt(pricing.unitPrice)} strong />

          {state.quantity > 1 && (
            <Row label="Cantitate" value={`× ${state.quantity}`} />
          )}

          <div className="border-t border-amber-200 mt-1 pt-2 flex justify-between font-semibold text-zinc-900">
            <span>{state.quantity > 1 ? `Total (${state.quantity} buc)` : 'Total'}</span>
            <span>{fmt(pricing.finalPrice)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full border border-zinc-300 text-zinc-600 font-medium
            hover:bg-zinc-50 transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Înapoi
        </button>
        <button
          disabled={!output}
          onClick={() => output && onSubmit(output)}
          className="flex-1 px-8 py-3 rounded-full bg-amber-700 text-white font-medium
            hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Trimite configurația
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between text-sm gap-4 ${strong ? 'font-medium text-zinc-900' : 'text-zinc-600'}`}>
      <span>{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}
