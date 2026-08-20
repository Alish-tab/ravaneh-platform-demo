import { useEffect, useId, useRef, type ReactNode } from 'react';

export type DialogShellProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  labelledBy?: string;
  showCloseButton?: boolean;
  closeDisabled?: boolean;
};

export function DialogShell({
  title,
  subtitle,
  icon,
  children,
  footer,
  onClose,
  labelledBy,
  showCloseButton = false,
  closeDisabled = false,
}: DialogShellProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const focusable = node?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? titleId}
      >
        <div className="dialog-header">
          {icon}
          <div>
            <h2 id={labelledBy ?? titleId} className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{subtitle}</p>
            ) : null}
          </div>
          {showCloseButton ? (
            <button
              type="button"
              className="btn btn-ghost btn-icon ms-auto"
              aria-label="بستن"
              disabled={closeDisabled}
              onClick={onClose}
            >
              ×
            </button>
          ) : null}
        </div>
        <div className="dialog-body">{children}</div>
        <div className="dialog-footer">{footer}</div>
      </div>
    </div>
  );
}
