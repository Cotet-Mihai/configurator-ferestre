// lib/configurator/types.ts

export type GlassCount = 1 | 2;
export type OpenDirection = 'left' | 'right';
export type ActivePane = 'left' | 'right' | 'both';
export type HandleSide = 'left' | 'right';

export interface OptionItem {
  id: string;
  label: string;
  priceModifier?: number;
  colorValue?: string; // hex opțional pentru preview SVG
}

export interface ProductConfig {
  productId: number;
  productName: string;
  pricePerSquareMeter: number;
  glassOptions: OptionItem[];
  colorOptions: OptionItem[];
  hardwareOptions: OptionItem[];
}

export interface Dimensions {
  width: number | null;
  height: number | null;
}

export type StepId =
  | 'glass-count'
  | 'opens'
  | 'oscilo'
  | 'direction'
  | 'active-pane'
  | 'handle-side'
  | 'dimensions'
  | 'configuration'
  | 'summary';

export interface StepNode {
  id: StepId;
  label: string;
  getNext: (state: ConfiguratorState) => StepId;
}

export interface ConfiguratorState {
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

export type ConfiguratorAction =
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
  | { type: 'JUMP_TO_STEP'; payload: StepId }
  | { type: 'ADVANCE' };

export interface PricingInput {
  pricePerSquareMeter: number;
  dimensions: { width: number; height: number };
  opens: boolean;
  isOscilo: boolean;
  quantity: number;
  optionModifiers?: number; // sum of selected option priceModifiers (per m²)
}

export interface PricingResult {
  area: number;
  basePrice: number;
  unitPrice: number;
  finalPrice: number;
}

export interface ConfiguratorOutput {
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
