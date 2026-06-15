'use client';

import type { PricingResult } from '@/lib/configurator/types';

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
