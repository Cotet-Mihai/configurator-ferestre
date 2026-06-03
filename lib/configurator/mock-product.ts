// lib/configurator/mock-product.ts
import type { ProductConfig } from './types';

export const MOCK_PRODUCT: ProductConfig = {
    productId: 1,
    productName: 'Fereastră din lemn stejar',
    pricePerSquareMeter: 1300,
    glassOptions: [
        { id: 'glass-tripan', label: 'Geam tripan', priceModifier: 0 },
    ],
    colorOptions: [
        { id: 'color-natural', label: 'Stejar natural', priceModifier: 0, colorValue: '#8B6914' },
        { id: 'color-white', label: 'Alb RAL 9016', priceModifier: 80, colorValue: '#F2F0EB' },
        { id: 'color-dark', label: 'Nuc închis', priceModifier: 60, colorValue: '#4A3728' },
    ],
    hardwareOptions: [
        { id: 'hw-standard', label: 'Feronerie standard (Roto, AGB sau G-U)', priceModifier: 0 },
    ],
};
