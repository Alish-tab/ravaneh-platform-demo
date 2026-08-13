type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
};

export function Toggle({ checked, onChange, label, disabled, id }: ToggleProps) {
  return (
    <label
      className="toggle-wrap"
      htmlFor={id}
      style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={['toggle-track', checked ? 'on' : ''].filter(Boolean).join(' ')}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-thumb" />
      </button>
      {label ? <span className="check-label">{label}</span> : null}
    </label>
  );
}
