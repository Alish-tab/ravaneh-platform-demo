import type { HTMLAttributes, ReactNode } from 'react';

type LtrProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

/** Technical values (UUID, lat/lon, codes) — LTR + mono, product font stays Vazirmatn elsewhere. */
export function LtrData({ children, className, ...rest }: LtrProps) {
  return (
    <span className={['ltr-data', className ?? ''].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}

/** LTR isolation without monospace. */
export function LtrIso({ children, className, ...rest }: LtrProps) {
  return (
    <span className={['ltr-iso', className ?? ''].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
