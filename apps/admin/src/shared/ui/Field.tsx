import type { InputHTMLAttributes, ReactNode } from 'react';

type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
};

export function Field({ label, hint, error, children, htmlFor }: FieldProps) {
  return (
    <div className="field-wrap">
      {label ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ error, className, ...rest }: InputProps) {
  return (
    <input
      className={['input', error ? 'input-error' : '', className ?? ''].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
