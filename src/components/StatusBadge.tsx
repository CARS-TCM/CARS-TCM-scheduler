/**
 * Status chips always carry a text label AND an icon, so meaning never depends on colour alone.
 * Colour pairs are light-on-dark with contrast of at least 7:1 (the tokens live in tailwind.config.js).
 */
const STYLES: Record<string, { cls: string; icon: string }> = {
  // Session status
  Available: { cls: 'border-ok-line bg-ok-bg text-ok-fg', icon: '✓' },
  'Nearly Full': { cls: 'border-warn-line bg-warn-bg text-warn-fg', icon: '▲' },
  Full: { cls: 'border-bad-line bg-bad-bg text-bad-fg', icon: '✕' },
  // Submission status
  'Not Started': { cls: 'border-line-strong bg-surface-2 text-ink', icon: '○' },
  Draft: { cls: 'border-info-line bg-info-bg text-info-fg', icon: '✎' },
  Confirmed: { cls: 'border-ok-line bg-ok-bg text-ok-fg', icon: '✓' },
  // Employee allocation status
  Unallocated: { cls: 'border-line-strong bg-surface-2 text-ink', icon: '○' },
  'Allocated (draft)': { cls: 'border-info-line bg-info-bg text-info-fg', icon: '◐' },
  'Allocated (confirmed)': { cls: 'border-ok-line bg-ok-bg text-ok-fg', icon: '●' },
  // Request status
  Submitted: { cls: 'border-info-line bg-info-bg text-info-fg', icon: '➤' },
  'Under review': { cls: 'border-vio-line bg-vio-bg text-vio-fg', icon: '…' },
  Added: { cls: 'border-ok-line bg-ok-bg text-ok-fg', icon: '✓' },
  Declined: { cls: 'border-bad-line bg-bad-bg text-bad-fg', icon: '✕' },
  'More information required': { cls: 'border-warn-line bg-warn-bg text-warn-fg', icon: '?' },
};

const FALLBACK = { cls: 'border-line-strong bg-surface-2 text-ink', icon: '•' };

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? FALLBACK;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${s.cls}`}
    >
      <span aria-hidden="true">{s.icon}</span>
      {status}
    </span>
  );
}
