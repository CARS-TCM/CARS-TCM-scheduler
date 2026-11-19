import { useState, type ReactNode } from 'react';
import { ADMIN, COUNCIL_NAME, managers } from '../data/sampleData';
import { timeZoneLabel, timeZoneName } from '../lib/dates';
import { useStore } from '../store/AppStore';
import { ConfirmDialog } from './Modal';
import { Toasts } from './Toasts';

export function Layout({ children }: { children: ReactNode }) {
  const { login, setLogin, resetData } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const value = login.role === 'admin' ? 'admin' : `manager:${login.managerId}`;

  const navBtn = (active: boolean) =>
    `rounded-md px-4 py-2 text-sm font-medium ${
      active ? 'bg-accent text-on-accent' : 'text-white hover:bg-brand-dark'
    }`;

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>

      <header className="border-b-4 border-accent bg-brand text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-50">{COUNCIL_NAME}</p>
            <h1 className="text-xl font-semibold">TRACE Release 8 – Staff Training Scheduler</h1>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="sample-login" className="block text-xs text-blue-50">
                Sample login (prototype only)
              </label>
              <select
                id="sample-login"
                className="mt-1 rounded-md border border-blue-200 bg-surface px-2 py-1.5 text-sm text-ink"
                value={value}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'admin') setLogin({ role: 'admin', managerId: login.managerId });
                  else setLogin({ role: 'manager', managerId: v.split(':')[1] });
                }}
              >
                <optgroup label="People Managers">
                  {managers.map((m) => (
                    <option key={m.id} value={`manager:${m.id}`}>
                      {m.name} – People Manager ({m.id})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Training Administrator">
                  <option value="admin">{ADMIN.name} – Training Administrator</option>
                </optgroup>
              </select>
            </div>
            <button
              type="button"
              className="rounded-md border border-blue-200 px-3 py-1.5 text-sm text-white hover:bg-brand-dark"
              onClick={() => setConfirmReset(true)}
            >
              Reset sample data
            </button>
          </div>
        </div>
        <nav aria-label="Switch view" className="mx-auto flex max-w-7xl gap-2 px-4 pb-2">
          <button
            type="button"
            className={navBtn(login.role === 'manager')}
            aria-current={login.role === 'manager' ? 'page' : undefined}
            onClick={() => setLogin({ role: 'manager', managerId: login.managerId })}
          >
            People Manager view
          </button>
          <button
            type="button"
            className={navBtn(login.role === 'admin')}
            aria-current={login.role === 'admin' ? 'page' : undefined}
            onClick={() => setLogin({ role: 'admin', managerId: login.managerId })}
          >
            Training Administrator view
          </button>
        </nav>
      </header>

      <div role="note" className="bg-brand-dark text-white">
        <p className="mx-auto max-w-7xl px-4 py-2 text-sm">
          <strong className="text-accent">Prototype with fictional data.</strong> Role checks in this app run in the browser and are not real
          security – production needs server-side enforcement. Times are shown in your local timezone (
          {timeZoneName()}, {timeZoneLabel()}).
        </p>
      </div>

      <main id="main" className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>

      <Toasts />

      {confirmReset && (
        <ConfirmDialog
          title="Reset sample data?"
          confirmLabel="Reset everything"
          danger
          message={<p>This discards all allocations, submissions and requests you have made in this browser and restores the starting sample data.</p>}
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetData();
            setConfirmReset(false);
          }}
        />
      )}
    </div>
  );
}
