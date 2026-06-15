# Configurator și Calculator de Preț — Ferestre din Lemn
**Data:** 2026-06-01  
**Status:** Aprobat  
**Stack:** Next.js 16 (App Router), TypeScript 5, Tailwind CSS v4, Framer Motion

---

## Context

Aplicație web standalone pentru configurarea și calcularea prețului ferestrelor din lemn personalizate. Rulează fullscreen, primește un JSON de produs de la WordPress și returnează un JSON cu configurația completă și prețul calculat. În faza de dezvoltare funcționează cu un mock JSON local.

---

## Arhitectură

Abordare: **mașină de stări explicită** (state machine). Fluxul de pași este un graf de noduri, fiecare nod știind ce pas urmează în funcție de starea curentă. Starea globală este gestionată cu `useReducer` în `ConfiguratorShell`.

### Flux de date

```
WordPress JSON
      ↓
mock-product.ts (dev) / prop extern (prod)
      ↓
ConfiguratorShell — useReducer(ConfiguratorState)
      ↓
transitions.ts → getNextStep(state) → StepId următor
      ↓
Step component activ → user input → dispatch(action)
      ↓
pricing.ts → useMemo → preț recalculat live
      ↓
Output JSON → callback către WordPress
```

---

## Structura fișierelor

```
app/
├── configurator/
│   └── page.tsx                  # pagina fullscreen
├── layout.tsx
├── page.tsx
└── globals.css

lib/
├── configurator/
│   ├── types.ts
│   ├── steps.ts
│   ├── transitions.ts
│   ├── pricing.ts
│   └── mock-product.ts

components/
├── configurator/
│   ├── ConfiguratorShell.tsx
│   ├── StepHistory.tsx
│   ├── steps/
│   │   ├── StepGlassCount.tsx
│   │   ├── StepOpens.tsx
│   │   ├── StepOscilo.tsx
│   │   ├── StepDirection.tsx
│   │   ├── StepActivePane.tsx
│   │   ├── StepHandleSide.tsx
│   │   ├── StepDimensions.tsx
│   │   └── StepConfiguration.tsx
│   ├── WindowPreview.tsx
│   └── PriceSummary.tsx
```

---

## Interfețe TypeScript

### Input

```typescript
interface ProductConfig {
  productId: number;
  productName: string;
  pricePerSquareMeter: number;
  glassOptions: OptionItem[];
  colorOptions: OptionItem[];
  hardwareOptions: OptionItem[];
}

interface OptionItem {
  id: string;
  label: string;
  priceModifier?: number;
}
```

### Starea globală

```typescript
type GlassCount = 1 | 2;
type OpenDirection = 'left' | 'right';
type ActivePane = 'left' | 'right' | 'both';
type HandleSide = 'left' | 'right';

interface Dimensions {
  width: number | null;
  height: number | null;
}

interface ConfiguratorState {
  product: ProductConfig;
  glassCount: GlassCount | null;
  opens: boolean | null;
  isOscilo: boolean | null;
  openDirection: OpenDirection | null;
  activePane: ActivePane | null;
  handleSide: HandleSide | null;
  dimensions: Dimensions;
  selectedGlass: string | null;
  selectedColor: string | null;
  selectedHardware: string | null;
  quantity: number;
  currentStepId: StepId;
  completedSteps: StepId[];
}
```

### Step machine

```typescript
type StepId =
  | 'glass-count'
  | 'opens'
  | 'oscilo'
  | 'direction'
  | 'active-pane'
  | 'handle-side'
  | 'dimensions'
  | 'configuration'
  | 'summary';

interface StepNode {
  id: StepId;
  label: string;
  getNext: (state: ConfiguratorState) => StepId;
}
```

### Output

```typescript
interface ConfiguratorOutput {
  productId: number;
  configuration: {
    glassCount: GlassCount;
    opens: boolean;
    isOscilo: boolean;
    openDirection: OpenDirection | null;
    activePane: ActivePane | null;
    handleSide: HandleSide | null;
    dimensions: { width: number; height: number };
    glass: OptionItem | null;
    color: OptionItem | null;
    hardware: OptionItem | null;
    quantity: number;
  };
  pricing: {
    pricePerSqm: number;
    area: number;
    basePrice: number;
    unitPrice: number;
    finalPrice: number;
  };
}
```

### Actions

```typescript
type ConfiguratorAction =
  | { type: 'SET_GLASS_COUNT'; payload: GlassCount }
  | { type: 'SET_OPENS'; payload: boolean }
  | { type: 'SET_OSCILO'; payload: boolean }
  | { type: 'SET_DIRECTION'; payload: OpenDirection }
  | { type: 'SET_ACTIVE_PANE'; payload: ActivePane }
  | { type: 'SET_HANDLE_SIDE'; payload: HandleSide }
  | { type: 'SET_DIMENSIONS'; payload: Partial<Dimensions> }
  | { type: 'SET_GLASS'; payload: string }
  | { type: 'SET_COLOR'; payload: string }
  | { type: 'SET_HARDWARE'; payload: string }
  | { type: 'SET_QUANTITY'; payload: number }
  | { type: 'GO_BACK' }
  | { type: 'JUMP_TO_STEP'; payload: StepId };
```

### Reguli derivate în reducer

**`handleSide` se setează automat — nu există un pas separat pentru el în aceste cazuri:**

- `SET_DIRECTION('left')` → `handleSide = 'left'` (1 geam, deschidere stânga)
- `SET_DIRECTION('right')` → `handleSide = 'right'` (1 geam, deschidere dreapta)
- `SET_ACTIVE_PANE('left')` → `handleSide = 'left'` (2 geamuri, doar stânga se deschide)
- `SET_ACTIVE_PANE('right')` → `handleSide = 'right'` (2 geamuri, doar dreapta se deschide)
- `SET_ACTIVE_PANE('both')` → `handleSide = null` (se va seta în pasul `handle-side`)

**`JUMP_TO_STEP` resetează toate câmpurile de stare ale pașilor de după cel țintă la `null`.** Exemplu: jump la `oscilo` resetează `openDirection`, `activePane`, `handleSide`, `dimensions`, `selectedGlass`, `selectedColor`, `selectedHardware`. Câmpurile din pașii anteriori rămân intacte.

---

## Graful de tranziții

```typescript
export const STEPS: Record<StepId, StepNode> = {
  'glass-count': {
    id: 'glass-count',
    label: 'Număr geamuri',
    getNext: () => 'opens',
  },
  'opens': {
    id: 'opens',
    label: 'Deschidere',
    getNext: (s) => s.opens ? 'oscilo' : 'dimensions',
  },
  'oscilo': {
    id: 'oscilo',
    label: 'Oscilobatant',
    getNext: (s) => s.glassCount === 1 ? 'direction' : 'active-pane',
  },
  'direction': {
    id: 'direction',
    label: 'Direcție deschidere',
    getNext: () => 'dimensions',
  },
  'active-pane': {
    id: 'active-pane',
    label: 'Geam activ',
    getNext: (s) => s.activePane === 'both' ? 'handle-side' : 'dimensions',
  },
  'handle-side': {
    id: 'handle-side',
    label: 'Poziție mâner',
    getNext: () => 'dimensions',
  },
  'dimensions': {
    id: 'dimensions',
    label: 'Dimensiuni',
    getNext: () => 'configuration',
  },
  'configuration': {
    id: 'configuration',
    label: 'Configurație',
    getNext: () => 'summary',
  },
  'summary': {
    id: 'summary',
    label: 'Sumar',
    getNext: () => 'summary',
  },
};
```

### Fluxuri complete

**1 geam, se deschide, oscilobatant:**
`glass-count → opens → oscilo → direction → dimensions → configuration → summary`

**1 geam, fix:**
`glass-count → opens → dimensions → configuration → summary`

**2 geamuri, ambele se deschid:**
`glass-count → opens → oscilo → active-pane → handle-side → dimensions → configuration → summary`

**2 geamuri, unul se deschide (stânga sau dreapta):**
`glass-count → opens → oscilo → active-pane → dimensions → configuration → summary`

---

## Motor de calcul preț

```typescript
interface PricingInput {
  pricePerSquareMeter: number;
  dimensions: { width: number; height: number };
  opens: boolean;
  isOscilo: boolean;
  quantity: number;
}

interface PricingResult {
  area: number;
  basePrice: number;
  unitPrice: number;
  finalPrice: number;
}

export function calculatePrice(input: PricingInput): PricingResult {
  const area = (input.dimensions.width / 100) * (input.dimensions.height / 100);
  const basePrice = area * input.pricePerSquareMeter;

  const multiplier = input.isOscilo ? 1.6
    : input.opens ? 1.5
    : 1.0;

  const unitPrice = Math.round(basePrice * multiplier);
  const finalPrice = unitPrice * input.quantity;

  return {
    area: Math.round(area * 100) / 100,
    basePrice: Math.round(basePrice),
    unitPrice,
    finalPrice,
  };
}
```

| Tip | Multiplicator | Exemplu 1mp × 1300 lei |
|---|---|---|
| Fixă | ×1.0 | 1.300 lei |
| Cu deschidere | ×1.5 | 1.950 lei |
| Oscilobatantă | ×1.6 | 2.080 lei |

`isOscilo` are prioritate față de `opens` — multiplicatorii nu se cumulează.

Calculul rulează în `useMemo` în `ConfiguratorShell`, recalculat la orice schimbare de dimensiuni, tip deschidere sau cantitate.

---

## Reprezentarea vizuală SVG

### Props

```typescript
interface WindowPreviewProps {
  dimensions: Dimensions;
  glassCount: GlassCount | null;
  opens: boolean | null;
  isOscilo: boolean | null;
  openDirection: OpenDirection | null;
  activePane: ActivePane | null;
  handleSide: HandleSide | null;
  selectedColor: string | null;
  colorOptions: OptionItem[];
}
```

### Stări vizuale progresive

| Stare | Vizual |
|---|---|
| Nicio dimensiune | Canvas gol, placeholder text |
| Doar lățime | Linie orizontală proporțională |
| + înălțime | Dreptunghi cu cadru |
| + culoare | Culoarea aplicată pe cadru |
| + 2 geamuri | Dreptunghi împărțit vertical |
| + deschidere | Săgeată diagonală în panoul activ |
| + oscilobatant | Săgeată diagonală + verticală (V rotit) |
| + mâner | Cerc mic pe marginea corectă |

### Scalare

```typescript
const VIEWPORT = 400;
const FRAME_THICKNESS = 12;

function toSvgSize(value: number, max: number): number {
  return Math.round((value / max) * (VIEWPORT - FRAME_THICKNESS * 2));
}
```

Animații SVG: `transition: all 200ms ease-out` pe atributele de dimensiune.

---

## UX/UI

### Layout fullscreen

```
┌─────────────────────────────────────────────────┐
│  StepHistory (~64px)                            │
│  [Număr geamuri] → [Deschidere] → ● Oscilobatant│
├─────────────────────────────────────────────────┤
│                                                 │
│           Conținut pas curent                   │
│           (flex-1, centrat vertical)            │
│                                                 │
└─────────────────────────────────────────────────┘
```

Pasul de dimensiuni: split form (stânga) + WindowPreview sticky (dreapta).

### Pași cu 2 opțiuni

**Desktop:** 50/50 split, toată suprafața clickabilă (`<button w-full h-full>`).
**Mobile:** stacked vertical, fiecare opțiune ~45vh.

### Animații între pași (Framer Motion)

```typescript
// Avansare: intră din dreapta
{ enter: { opacity: 0, x: 40 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 } }

// GO_BACK: intră din stânga
{ enter: { opacity: 0, x: -40 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 40 } }
```

Durată: `0.25s ease-out`. Fără spring sau bounce.

### Hover opțiuni 50/50

```
group-hover:scale-[1.02] group-hover:brightness-95 transition-all duration-200
```

### Paleta vizuală

| Element | Valoare |
|---|---|
| Background | `zinc-50` / `white` |
| Cadru SVG default | `#8B6914` |
| Accent | `stone-800` / `amber-700` |
| Text primar | `zinc-900` |
| Text secundar | `zinc-500` |

### StepHistory

- Pași parcurși: text normal, clickabili, underline la hover
- Pas curent: bold + `●`
- Separator: `→`
- Click pe pas parcurs → `JUMP_TO_STEP` (resetează starea pașilor de după)
- Mobile: scroll orizontal

---

## Contract API

### Input (WordPress → Configurator)

```json
{
  "productId": 1,
  "productName": "Fereastră din lemn stejar",
  "pricePerSquareMeter": 1300,
  "glassOptions": [
    { "id": "glass-2", "label": "Geam dublu 4/16/4", "priceModifier": 0 },
    { "id": "glass-3", "label": "Geam triplu 4/16/4/16/4", "priceModifier": 150 }
  ],
  "colorOptions": [
    { "id": "color-natural", "label": "Stejar natural", "priceModifier": 0 },
    { "id": "color-white", "label": "Alb RAL 9016", "priceModifier": 80 }
  ],
  "hardwareOptions": [
    { "id": "hw-standard", "label": "Feronerie standard", "priceModifier": 0 },
    { "id": "hw-premium", "label": "Feronerie premium Roto", "priceModifier": 200 }
  ]
}
```

### Output (Configurator → WordPress)

```json
{
  "productId": 1,
  "configuration": {
    "glassCount": 2,
    "opens": true,
    "isOscilo": false,
    "openDirection": null,
    "activePane": "left",
    "handleSide": "left",
    "dimensions": { "width": 120, "height": 140 },
    "glass": { "id": "glass-3", "label": "Geam triplu 4/16/4/16/4", "priceModifier": 150 },
    "color": { "id": "color-natural", "label": "Stejar natural", "priceModifier": 0 },
    "hardware": { "id": "hw-standard", "label": "Feronerie standard", "priceModifier": 0 },
    "quantity": 2
  },
  "pricing": {
    "pricePerSqm": 1300,
    "area": 1.68,
    "basePrice": 2184,
    "unitPrice": 3276,
    "finalPrice": 6552
  }
}
```

Dropdown-urile cu `options: []` nu apar în UI.

---

## Extensibilitate

| Extindere | Modificări necesare |
|---|---|
| 3 geamuri | `GlassCount` += `3`, nod `active-pane-triple` în graf, `getNext` din `oscilo` bifurcă pe `glassCount === 3` |
| Uși de balcon | `productType` în `ProductConfig`, `glass-count.getNext` bifurcă pe `productType` spre subgraf dedicat |
| Noi deschideri (pivotantă, glisantă) | Valori noi în `OpenDirection`, nod nou de pas |
| Noi opțiuni configurare | Câmp nou în `ProductConfig` + câmp în `StepConfiguration` |

---

## Dependențe noi necesare

```bash
pnpm add framer-motion
```

Framer Motion este singura dependență adăugată față de scaffold. SVG-ul este randat nativ, fără biblioteci externe.
