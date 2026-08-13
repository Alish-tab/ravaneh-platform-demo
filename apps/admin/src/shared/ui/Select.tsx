import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select className={['select', className ?? ''].filter(Boolean).join(' ')} {...rest}>
      {children}
    </select>
  );
}
