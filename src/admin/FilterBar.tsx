import { managers, sessions, teams } from '../data/sampleData';
import { formatDate } from '../lib/dates';
import { emptyFilters, hasActiveFilters, type AdminFilters } from '../lib/filters';
import { byStart } from '../lib/rules';

interface Props {
  filters: AdminFilters;
  onChange: (f: AdminFilters) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  const set = <K extends keyof AdminFilters>(k: K, v: AdminFilters[K]) => onChange({ ...filters, [k]: v });
  const sorted = [...sessions].sort(byStart);

  return (
    <section aria-labelledby="filters-h" className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="filters-h" className="text-lg font-semibold">
          Filters
        </h2>
        <button type="button" className="btn-secondary" onClick={() => onChange(emptyFilters)} disabled={!hasActiveFilters(filters)}>
          Clear all filters
        </button>
      </div>
      <p className="text-sm text-muted">Filters apply to the tables and CSV exports below.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="f-manager" className="label">
            Manager
          </label>
          <select id="f-manager" className="input" value={filters.managerId} onChange={(e) => set('managerId', e.target.value)}>
            <option value="">All managers</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-team" className="label">
            Team or business area
          </label>
          <select id="f-team" className="input" value={filters.teamId} onChange={(e) => set('teamId', e.target.value)}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-session" className="label">
            Session
          </label>
          <select id="f-session" className="input" value={filters.sessionId} onChange={(e) => set('sessionId', e.target.value)}>
            <option value="">All sessions</option>
            {sorted.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({formatDate(s.startsAt)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-date" className="label">
            Session date
          </label>
          <input id="f-date" type="date" className="input" value={filters.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-sub" className="label">
            Submission status
          </label>
          <select
            id="f-sub"
            className="input"
            value={filters.submissionStatus}
            onChange={(e) => set('submissionStatus', e.target.value as AdminFilters['submissionStatus'])}
          >
            <option value="">Any status</option>
            <option>Not Started</option>
            <option>Draft</option>
            <option>Confirmed</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-alloc" className="label">
            Allocation status
          </label>
          <select
            id="f-alloc"
            className="input"
            value={filters.allocationStatus}
            onChange={(e) => set('allocationStatus', e.target.value as AdminFilters['allocationStatus'])}
          >
            <option value="">Allocated and unallocated</option>
            <option>Allocated</option>
            <option>Unallocated</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="f-search" className="label">
            Search employees or requests
          </label>
          <input
            id="f-search"
            type="search"
            className="input"
            placeholder="Name or employee ID"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
