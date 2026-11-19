import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatTimeRange, formatWeekday } from '../lib/dates';
import { filterSessions, type AdminFilters } from '../lib/filters';
import { allocatedCount, capacityPercent, eligibleTeamNames, sessionStatus } from '../lib/rules';
import { useStore } from '../store/AppStore';

export function CapacityTable({ filters, onViewAttendees }: { filters: AdminFilters; onViewAttendees: (sessionId: string) => void }) {
  const { state } = useStore();
  const rows = filterSessions(state, filters);

  if (rows.length === 0) return <p className="card p-6 text-center text-sm">No sessions match the current filters.</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[60rem] border-collapse">
        <caption className="sr-only">Session capacity</caption>
        <thead>
          <tr>
            {['Session', 'Date and time', 'Eligible teams', 'Max', 'Allocated', 'Remaining', 'Capacity', 'Status', 'Attendees'].map((h) => (
              <th key={h} scope="col" className="th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const n = allocatedCount(state, s.id);
            const pct = capacityPercent(n, s.capacity);
            const status = sessionStatus(n, s.capacity);
            const bar = status === 'Full' ? 'bg-red-400' : status === 'Nearly Full' ? 'bg-amber-400' : 'bg-emerald-400';
            return (
              <tr key={s.id}>
                <th scope="row" className="td text-left font-medium">
                  {s.name}
                  <span className="block text-xs font-normal text-muted">
                    {s.method} · {s.facilitator}
                  </span>
                </th>
                <td className="td">
                  {formatWeekday(s.startsAt)} {formatDate(s.startsAt)}
                  <span className="block text-xs text-muted">{formatTimeRange(s.startsAt, s.endsAt)}</span>
                </td>
                <td className="td text-xs">{eligibleTeamNames(s)}</td>
                <td className="td">{s.capacity}</td>
                <td className="td">{n}</td>
                <td className="td">{Math.max(0, s.capacity - n)}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-label={`${s.name} capacity`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      className="h-2 w-20 overflow-hidden rounded bg-line"
                    >
                      <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-medium">{pct}%</span>
                  </div>
                </td>
                <td className="td">
                  <StatusBadge status={status} />
                </td>
                <td className="td">
                  <button type="button" className="btn-secondary" onClick={() => onViewAttendees(s.id)}>
                    View attendees<span className="sr-only"> for {s.name}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
