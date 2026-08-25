import { Link } from 'react-router-dom';
import {
  BUTTON_SIZES, BUTTON_VARIANTS, BUTTON_SHAPES,
  BUTTON_VARIANT_ALIASES, BUTTON_SIZES_LIST, BUTTON_VARIANTS_LIST, BUTTON_SHAPES_LIST,
  isValidVariant, isValidSize, isValidShape, resolveVariant,
} from '../../constants/button';

export {
  BUTTON_SIZES, BUTTON_VARIANTS, BUTTON_SHAPES,
  BUTTON_VARIANT_ALIASES, BUTTON_SIZES_LIST, BUTTON_VARIANTS_LIST, BUTTON_SHAPES_LIST,
  isValidVariant, isValidSize, isValidShape, resolveVariant,
};

export default function Button({
  variant = 'primary',
  size = 'md',
  shape = 'md',
  to,
  href,
  className = '',
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none';

  const resolvedVariant = resolveVariant(variant);
  const classes = `${base} ${BUTTON_SIZES[size] || BUTTON_SIZES.md} ${BUTTON_VARIANTS[resolvedVariant] || BUTTON_VARIANTS.primary} ${BUTTON_SHAPES[shape] || BUTTON_SHAPES.md} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
