import type { ReactNode } from 'react';

type PanelProps = {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, actions, children, className }: PanelProps) {
  return (
    <section className={['panel', className ?? ''].filter(Boolean).join(' ')}>
      {title || actions ? (
        <header className="panel-header">
          {title ? <h2 className="panel-title">{title}</h2> : <span />}
          {actions}
        </header>
      ) : null}
      <div className="panel-body">{children}</div>
    </section>
  );
}
