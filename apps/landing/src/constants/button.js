export const BUTTON_SIZES = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-[30px] py-[15px] text-sm',
  lg: 'px-[30px] py-[15px] text-base',
  xl: 'px-[30px] py-[15px] text-base',
};

export const BUTTON_VARIANTS = {
  primary: 'bg-brand-orange text-white font-semibold hover:brightness-90 shadow-sm transition-all',
  'primary-lg': 'bg-brand-orange text-white font-semibold hover:brightness-90 shadow-lg shadow-brand-orange/25 transition-all',
  secondary: 'bg-white/10 text-white font-semibold hover:bg-white/20 border border-white/20 transition-all',
  accent: 'bg-brand-orange text-white font-semibold hover:brightness-90 shadow-sm transition-all',
  success: 'bg-brand-orange text-white font-semibold hover:brightness-90 shadow-sm transition-all',
  outline: 'border-2 border-brand-blue text-brand-blue font-semibold hover:bg-brand-blue hover:text-white transition-all',
  'outline-white': 'border-2 border-white text-white font-semibold hover:bg-white hover:text-brand-blue transition-all',
  ghost: 'text-text-gray font-medium hover:text-brand-orange hover:bg-gray-50 transition-all',
  'ghost-red': 'text-gray-400 font-medium hover:text-red-600 hover:bg-red-50 transition-all',
  'ghost-blue': 'text-gray-400 font-medium hover:text-blue-600 hover:bg-blue-50 transition-all',
  link: 'text-brand-orange font-medium hover:text-brand-blue transition-all',
  'link-add': 'text-brand-orange font-medium hover:text-brand-blue inline-flex items-center gap-1.5 transition-all',
  pill: 'bg-gray-100 text-text-gray font-medium hover:bg-gray-200 transition-all',
  'pill-active': 'bg-brand-orange text-white font-medium shadow-sm transition-all',
  'pill-orange': 'bg-brand-orange text-white font-medium shadow-md transition-all',
};

export const BUTTON_SHAPES = {
  pill: 'rounded-full',
  md: 'rounded-lg',
  sm: 'rounded-md',
  square: 'rounded-lg',
};

export const BUTTON_VARIANT_ALIASES = {
  orange: 'primary',
  outlineWhite: 'outline-white',
  purple: 'accent',
};

export const BUTTON_SIZES_LIST = Object.keys(BUTTON_SIZES);
export const BUTTON_VARIANTS_LIST = Object.keys(BUTTON_VARIANTS);
export const BUTTON_SHAPES_LIST = Object.keys(BUTTON_SHAPES);

export function resolveVariant(variant) {
  return BUTTON_VARIANT_ALIASES[variant] || variant;
}

export function isValidVariant(v) { return !!BUTTON_VARIANTS[resolveVariant(v)]; }
export function isValidSize(s) { return !!BUTTON_SIZES[s]; }
export function isValidShape(s) { return !!BUTTON_SHAPES[s]; }
