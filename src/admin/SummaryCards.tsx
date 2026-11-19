import { managers, sessions } from '../data/sampleData';
import { allocatedCount, openRequests, sessionStatus, submissionFor } from '../lib/rules';
import type { AppState } from '../types';

export function SummaryCards({ state }: { state: AppState }) {
  const total = state.employees.length;
  const allocated = state.employees.filter((e) => state.allocations[e.id]).length;
  const pct = total ? Math.round((allocated / total) * 100) : 0;
  const nearFull = sessions.filter((s) => sessionStatus(allocatedCount(state, s.id), s.capacity) !== 'Available').length;
  const statuses = managers.map((m) => submissionFor(state, m.teamId).status);
  const count = (s: string) => statuses.filter((x) => x === s).length;

  const cards: { label: string; value: string | number; hint?: string }[] = [
    { label: 'Total employees', value: total },
    { label: 'Employees allocated', value: allocated },
    { label: 'Employees unallocated', value: total - allocated },
    { label: 'Overall allocation', value: `${pct}%`, hint: `${allocated} of ${total}` },
    { label: 'Total sessions', value: sessions.length },
    { label: 'Sessions at or near capacity', value: nearFull, hint: '80% full or more' },
    { label: 'Managers confirmed', value: count('Confirmed'), hint: `of ${managers.length}` },
    { label: 'Managers not started', value: count('Not Started') },
    { label: 'Managers with drafts in progress', value: count('Draft') },
    { label: 'Outstanding team member requests', value: openRequests(state).length, hint: 'Submitted, under review or more info needed' },
  ];

  return (
    <section aria-labelledby="summary-h">
      <h2 id="summary-h" className="mb-2 text-lg font-semibold">
        Overview <span className="text-sm font-normal text-muted">(all teams – filters below don’t change these cards)</span>
      </h2>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card p-3">
            <dt className="text-sm text-ink2">{c.label}</dt>
            <dd className="text-3xl font-semibold">{c.value}</dd>
            {c.hint && <p className="text-xs text-muted">{c.hint}</p>}
          </div>
        ))}
      </dl>
    </section>
  );
}
