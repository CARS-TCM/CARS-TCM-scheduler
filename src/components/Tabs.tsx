import type { KeyboardEvent, ReactNode } from 'react';

interface TabsProps<T extends string> {
  label: string;
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
}

/** WAI-ARIA tabs with arrow-key navigation. The panel is the children. */
export function Tabs<T extends string>({ label, tabs, active, onChange, children }: TabsProps<T>) {
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 border-b border-line-strong">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`-mb-px rounded-t-md border-b-4 px-4 py-2 text-sm font-medium ${
              active === t.id
                ? 'border-accent bg-surface text-accent'
                : 'border-transparent text-ink2 hover:bg-surface-2'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} className="pt-4">
        {children}
      </div>
    </div>
  );
}
