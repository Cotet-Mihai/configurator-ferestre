# Calculator Ferestre

Aplicație web interactivă pentru configurarea și calculul prețului ferestrelor din lemn. Ghidează utilizatorul pas cu pas prin alegerea opțiunilor, afișând un preview SVG în timp real și calculând prețul final.

---

## Cuprins

- [Stack tehnic](#stack-tehnic)
- [Comenzi](#comenzi)
- [Arhitectură](#arhitectură)
- [Fluxul utilizatorului](#fluxul-utilizatorului)
- [Logica de calcul](#logica-de-calcul)
- [Componente](#componente)
- [Tipuri TypeScript](#tipuri-typescript)
- [Output final](#output-final)

---

## Stack tehnic

| Tehnologie | Versiune | Rol |
|---|---|---|
| Next.js | 16.2.6 (canary) | Framework, App Router |
| React | 19.2.4 | UI |
| TypeScript | 5 strict | Tipizare |
| Tailwind CSS | v4 | Stilizare (fără `tailwind.config.*`) |
| Framer Motion | 12.x | Animații tranziții și SVG |
| pnpm | — | Package manager |

---

## Comenzi

```bash
pnpm dev      # Server dev la http://localhost:3000
pnpm build    # Build producție
pnpm start    # Rulează build producție
pnpm lint     # ESLint
```

---

## Arhitectură

```
app/
├── layout.tsx                          # Root layout (Geist fonts, dark mode vars)
├── page.tsx                            # Redirect → /configurator-ferestre
├── globals.css                         # Tailwind @import + CSS custom properties
└── configurator-ferestre/
    └── page.tsx                        # Pagina configuratorului

components/configurator/
├── ConfiguratorShell.tsx               # Container: state management, routing pași
├── BinaryChoice.tsx                    # Componentă reutilizabilă alegeri Da/Nu
├── PriceSummary.tsx                    # Card breakdown preț
├── StepHistory.tsx                     # Navigare pași parcurși (breadcrumb)
├── WindowPreview.tsx                   # Preview SVG animat al ferestrei
└── steps/
    ├── StepGlassCount.tsx              # Pas 1: 1 sau 2 geamuri
    ├── StepOpens.tsx                   # Pas 2: Se deschide?
    ├── StepOscilo.tsx                  # Pas 3: Oscilobatant?
    ├── StepDirection.tsx               # Pas 4a: Direcție (1 geam)
    ├── StepActivePane.tsx              # Pas 4b: Ce geam se deschide? (2 geamuri)
    ├── StepHandleSide.tsx              # Pas 5: Poziție mâner (ambele geamuri)
    ├── StepDimensions.tsx              # Pas 6: Dimensiuni + specificații produs
    └── StepSummary.tsx                 # Pas 7: Recapitulare + submit

lib/configurator/
├── types.ts                            # Toate tipurile TypeScript
├── steps.ts                            # Definiție pași + logica tranziției
├── limits.ts                           # Limite dimensiuni per tip fereastră
├── pricing.ts                          # Calcul preț
├── transitions.ts                      # Logica navigației înapoi
└── mock-product.ts                     # Date produs (Fereastră lemn stejar)
```

### Rute

| URL | Componentă |
|---|---|
| `/` | Redirect la `/configurator-ferestre` |
| `/configurator-ferestre` | `ConfiguratorShell` cu `MOCK_PRODUCT` |

---

## Fluxul utilizatorului

Fluxul este **dinamic** — pașii se ramifică în funcție de alegerile anterioare:

```
[1] glass-count (1 sau 2 geamuri)
        ↓
[2] opens (Se deschide?)
    │
    ├─ NU ───────────────────────────────────────────┐
    │                                                │
    └─ DA                                            │
         ↓                                           │
        [3] oscilo (Oscilobatant?)                   │
             │                                       │
             ├─ 1 geam →      direction              │
             │             (stânga/dreapta)          │
             │                     │                 │
             └─ 2 geamuri →   active-pane            │
                           (stânga/dreapta/ambele)   │
                                   │                 │
                           ambele ─┤                 │
                                   ↓                 │
                              [5] handle-side        │
                                   │                 │
                                   └─────────────────┤
                                                     │
                                                     ↓
                                            [6] dimensions
                            (lățime, înălțime, sticlă, culoare, feronerie, cantitate)
                                                     ↓
                                               [7] summary
                                         (recapitulare + submit)
```

### Navigare

- **Înainte:** buton sau selecție automată (BinaryChoice)
- **Înapoi:** buton "Înapoi" în fiecare pas
- **Salt la pas anterior:** click pe `StepHistory` — resetează câmpurile afectate de ramura sărită

---

## Logica de calcul

### Limite dimensiuni (`lib/configurator/limits.ts`)

Dimensiunile minime/maxime depind de tipul de fereastră:

| Configurație | Min lăț | Max lăț | Min înălț | Max înălț |
|---|---|---|---|---|
| 1 geam fix | 50 cm | 150 cm | 40 cm | 210 cm |
| 1 geam mobil | 50 cm | 105 cm | 50 cm | 210 cm |
| 2 geamuri fix+fix | 100 cm | 300 cm | 40 cm | 210 cm |
| 2 geamuri mobil+mobil | 100 cm | 210 cm | 50 cm | 210 cm |

Dacă dimensiunile depășesc limitele, preview-ul afișează un overlay **"Comandă specială"** cu informații de contact.

### Calcul preț (`lib/configurator/pricing.ts`)

```
1. Suprafață (m²)        = (lățime cm / 100) × (înălțime cm / 100)

2. Preț efectiv/m²       = pricePerSquareMeter + modificatori opțiuni
                           (sticlă + culoare + feronerie)

3. Preț bază             = suprafață × preț efectiv/m²

4. Multiplicator tip:
   - Fix:                × 1.0
   - Deschidere simplă:  × 1.5
   - Oscilobatant:       × 1.6

5. Preț/buc              = preț bază × multiplicator

6. Preț total            = preț/buc × cantitate
```

---

## Componente

### `ConfiguratorShell`

Container principal. Gestionează state-ul global cu `useReducer`, calculează prețul cu `useMemo`, animează tranzițiile între pași (slide stânga/dreapta cu Framer Motion).

**Acțiuni reducer:**

| Acțiune | Efect |
|---|---|
| `SET_GLASS_COUNT` | Setează numărul de geamuri |
| `SET_OPENS` | Setează dacă fereastra se deschide |
| `SET_OSCILO` | Setează tipul de deschidere |
| `SET_DIRECTION` | Setează direcția (stânga/dreapta) |
| `SET_ACTIVE_PANE` | Setează ce geam se deschide |
| `SET_HANDLE_SIDE` | Setează poziția mânerului |
| `SET_DIMENSIONS` | Setează lățimea și înălțimea |
| `SET_GLASS` / `SET_COLOR` / `SET_HARDWARE` | Setează opțiunile produs |
| `SET_QUANTITY` | Setează cantitatea |
| `ADVANCE` | Avansează la pasul următor |
| `GO_BACK` | Revine la pasul anterior |
| `JUMP_TO_STEP` | Salt la un pas anterior (cu reset câmpuri dependente) |

---

### `WindowPreview`

Preview SVG animat al ferestrei, actualizat în timp real la orice schimbare.

**Funcționalități:**
- Scalare automată proporțional cu dimensiunile introduse
- Culoare cadru din opțiunea de culoare selectată
- Indicator grafic de deschidere:
  - **Deschidere simplă:** 2 linii (mâner ↔ balamale)
  - **Oscilobatant:** 4 linii (apex + mâner ↔ balamale)
- Mâner (cerc) poziționat pe marginea corectă a panoului
- Separator vertical pentru ferestre cu 2 geamuri
- Overlay "Comandă specială" dacă dimensiunile depășesc limitele
- Animații Framer Motion pe fiecare element SVG

---

### `BinaryChoice`

Componentă reutilizabilă pentru alegeri cu exact 2 opțiuni.

- Debounce 400ms pentru prevenirea double-click accidental
- Avansează automat la pasul următor după selecție
- Folosit de: `StepGlassCount`, `StepOpens`, `StepOscilo`, `StepDirection`, `StepHandleSide`

---

### `StepDimensions`

Pasul cel mai complex — layout pe 2 coloane:

- **Stânga:** formularul cu lățime/înălțime (cm), sticlă, feronerie, culoare (color picker), cantitate
- **Dreapta:** `WindowPreview` actualizat live (cu debounce 500ms)
- Butonul "Vezi sumar" este dezactivat dacă dimensiunile nu respectă limitele

---

### `StepHistory`

Breadcrumb de navigare în partea de sus:

- **Pași completați:** clickabili, permit salt înapoi
- **Pasul curent:** evidențiat cu `●`
- **Pași viitori:** dezactivați (text gri)

---

### `PriceSummary`

Card cu detalii preț afișat în `StepDimensions` și `StepSummary`:

- Suprafață (m²)
- Preț bază
- Preț/buc (cu multiplicator tip)
- Cantitate (dacă > 1)
- **Total**

---

## Tipuri TypeScript

```typescript
// lib/configurator/types.ts

type GlassCount = 1 | 2;
type OpenDirection = 'left' | 'right';
type ActivePane = 'left' | 'right' | 'both';
type HandleSide = 'left' | 'right';

interface ConfiguratorState {
  product: ProductConfig;
  glassCount: GlassCount | null;
  opens: boolean | null;
  isOscilo: boolean | null;
  openDirection: OpenDirection | null;
  activePane: ActivePane | null;
  handleSide: HandleSide | null;
  dimensions: { width: number; height: number };
  selectedGlass: string | null;
  selectedColor: string | null;
  selectedHardware: string | null;
  quantity: number;
  currentStepId: StepId;
  completedSteps: StepId[];
}

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
  priceModifier?: number;   // RON/m² adăugat la prețul de bază
  colorValue?: string;      // Valoare hex pentru color picker
}

interface PricingResult {
  area: number;
  basePrice: number;
  unitPrice: number;
  finalPrice: number;
}

type StepId =
  | 'glass-count'
  | 'opens'
  | 'oscilo'
  | 'direction'
  | 'active-pane'
  | 'handle-side'
  | 'dimensions'
  | 'summary';
```

---

## Output final

La submit, aplicația produce un obiect `ConfiguratorOutput`:

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
    glass: string;
    color: string;
    hardware: string;
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

Momentan, `handleSubmit()` face `console.log` cu outputul. Integrarea cu WordPress este planificată via `postMessage` sau callback extern.

---

## Date produs (mock)

```
Produs:              Fereastră din lemn stejar
Preț bază/m²:        1.300 RON

Opțiuni sticlă:
  - Geam tripan (+0 RON/m²)

Culori:
  - Stejar natural  #8B6914  (+0 RON/m²)
  - Alb RAL 9016    #F2F0EB  (+80 RON/m²)
  - Nuc închis      #4A3728  (+60 RON/m²)

Feronerie:
  - Standard (Roto, AGB sau G-U)  (+0 RON/m²)
```

---

## Contact (Comandă specială)

Afișat când dimensiunile depășesc limitele standard:

- **Telefon:** +40 743 888 887
- **Email:** design@tudorcraft.eu
- **Program:** Luni–Vineri 10:00 – 18:00
