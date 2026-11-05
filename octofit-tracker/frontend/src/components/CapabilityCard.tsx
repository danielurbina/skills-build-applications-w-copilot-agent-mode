import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, loading = false, error, emptyMessage, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading...</p> : null}
        {error ? <p role="alert">Unable to load {title.toLowerCase()}.</p> : null}
        {!loading && !error && children ? children : null}
        {!loading && !error && !children && emptyMessage ? <p>{emptyMessage}</p> : null}
      </div>
    </section>
  );
}
