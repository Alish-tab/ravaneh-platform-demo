import type { InputHTMLAttributes, ReactNode } from 'react';

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
};

export function Radio({ label, id, className, ...rest }: RadioProps) {
  return (
    <label className={['check-wrap', className ?? ''].filter(Boolean).join(' ')} htmlFor={id}>
      <input id={id} type="radio" {...rest} />
      {label ? <span className="check-label">{label}</span> : null}
    </label>
  );
}
