import { useStore, type ToastKind } from '../store/AppStore';

const STYLE: Record<ToastKind, { cls: string; icon: string; label: string }> = {
  success: { cls: 'border-ok-line bg-ok-bg text-ok-fg', icon: '✓', label: 'Success' },
  info: { cls: 'border-info-line bg-info-bg text-info-fg', icon: 'ℹ', label: 'Info' },
  warning: { cls: 'border-warn-line bg-warn-bg text-warn-fg', icon: '▲', label: 'Warning' },
  error: { cls: 'border-bad-line bg-bad-bg text-bad-fg', icon: '✕', label: 'Error' },
};

/** Live region: messages are announced by screen readers and carry an icon and a text label. */
export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const s = STYLE[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-md border-l-4 border p-3 text-sm shadow-lg ${s.cls}`}
          >
            <span aria-hidden="true" className="mt-0.5 font-bold">
              {s.icon}
            </span>
            <p className="flex-1">
              <strong>{s.label}: </strong>
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="rounded px-1 font-semibold underline"
              aria-label={`Dismiss ${s.label.toLowerCase()} message`}
            >
              Dismiss
            </button>
          </div>
        );
      })}
    </div>
  );
}
