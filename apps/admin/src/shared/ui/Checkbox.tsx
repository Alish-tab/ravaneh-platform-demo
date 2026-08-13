import type { InputHTMLAttributes, ReactNode } from 'react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
};

export function Checkbox({ label, id, className, ...rest }: CheckboxProps) {
  return (
    <label className={['check-wrap', className ?? ''].filter(Boolean).join(' ')} htmlFor={id}>
      <input id={id} type="checkbox" {...rest} />
      {label ? <span className="check-label">{label}</span> : null}
    </label>
  );
}
