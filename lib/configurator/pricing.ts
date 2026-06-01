// lib/configurator/pricing.ts
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
