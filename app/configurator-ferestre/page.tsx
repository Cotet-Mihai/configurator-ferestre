'use client';

import { useEffect, useState } from 'react';
import { MOCK_PRODUCT } from '@/lib/configurator/mock-product';
import { ConfiguratorShell } from '@/components/configurator/ConfiguratorShell';
import type { ProductConfig } from '@/lib/configurator/types';

export default function ConfiguratorPage() {
  const [product, setProduct] = useState<ProductConfig | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('product');
    if (!encoded) {
      setProduct(MOCK_PRODUCT);
      return;
    }
    try {
      const json = atob(decodeURIComponent(encoded));
      const parsed = JSON.parse(json) as ProductConfig;
      if (
        parsed &&
        typeof parsed.productId === 'number' &&
        typeof parsed.pricePerSquareMeter === 'number' &&
        Array.isArray(parsed.glassOptions) &&
        Array.isArray(parsed.colorOptions) &&
        Array.isArray(parsed.hardwareOptions)
      ) {
        setProduct(parsed);
      } else {
        setProduct(MOCK_PRODUCT);
      }
    } catch {
      setProduct(MOCK_PRODUCT);
    }
  }, []);

  if (!product) return null;

  return <ConfiguratorShell product={product} />;
}
