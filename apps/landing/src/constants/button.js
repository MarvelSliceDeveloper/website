export const BUTTON_SIZES = {
  xs: 'px-2.5 py-2 text-[11px] sm:text-xs',
  sm: 'px-3 py-2.5 text-[11px] sm:text-xs sm:px-4 sm:py-2 sm:text-sm',
  md: 'px-3.5 py-2.5 text-[11px] sm:text-xs sm:px-[30px] sm:py-[15px] sm:text-sm',
  lg: 'px-3.5 py-2.5 text-[11px] sm:text-xs sm:px-[30px] sm:py-[15px] sm:text-base',
  xl: 'px-3.5 py-2.5 text-[11px] sm:text-xs sm:px-[30px] sm:py-[15px] sm:text-base',
};

export const BUTTON_VARIANTS = {
  primary: 'bg-brand-orange text-white font-extrabold hover:brightness-90 shadow-sm active:scale-95 transition-all',
  'primary-lg': 'bg-brand-orange text-white font-extrabold hover:brightness-90 shadow-lg shadow-brand-orange/25 active:scale-95 transition-all',
  secondary: 'bg-white/10 text-white font-extrabold hover:bg-white/20 border border-white/20 active:scale-95 transition-all',
  accent: 'bg-brand-orange text-white font-extrabold hover:brightness-90 shadow-sm active:scale-95 transition-all',
  success: 'bg-brand-orange text-white font-extrabold hover:brightness-90 shadow-sm active:scale-95 transition-all',
  outline: 'border-2 border-brand-blue text-brand-blue font-extrabold hover:bg-brand-blue hover:text-white active:scale-95 transition-all',
  'outline-white': 'border-2 border-white text-white font-extrabold hover:bg-white hover:text-brand-blue active:scale-95 transition-all',
  ghost: 'text-text-gray font-semibold hover:text-brand-orange hover:bg-gray-50 active:scale-95 transition-all',
  'ghost-red': 'text-gray-400 font-semibold hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all',
  'ghost-blue': 'text-gray-400 font-semibold hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition-all',
  link: 'text-brand-orange font-semibold hover:text-brand-blue transition-all',
  'link-add': 'text-brand-orange font-semibold hover:text-brand-blue inline-flex items-center gap-1.5 transition-all',
  pill: 'bg-gray-100 text-text-gray font-extrabold hover:bg-gray-200 border border-gray-300 active:scale-95 transition-all',
  'pill-active': 'bg-brand-orange text-white font-extrabold shadow-sm active:scale-95 transition-all',
  'pill-orange': 'bg-brand-orange text-white font-extrabold shadow-md active:scale-95 transition-all',
};

export const BUTTON_SHAPES = {
  pill: 'rounded-full',
  md: 'rounded-full sm:rounded-lg',
  sm: 'rounded-full sm:rounded-md',
  square: 'rounded-full sm:rounded-lg',
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
