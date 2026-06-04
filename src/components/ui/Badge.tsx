export type BadgeTone = 'neut' | 'warn' | 'pos' | 'danger' | 'info';

export function Badge({
  tone = 'neut',
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return <span className={`badge b-${tone}`}>{children}</span>;
}
