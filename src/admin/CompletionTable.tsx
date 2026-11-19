import { useState } from 'react';
import { ConfirmDialog } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime } from '../lib/dates';
import { completionRows, type AdminFilters } from '../lib/filters';
import { useStore } from '../store/AppStore';

export function CompletionTable({ filters }: { filters: AdminFilters }) {
  const { state, adminReopen } = useStore();
  const [reopenTeam, setReopenTeam] = useState<string | null>(null);
  const rows = completionRows(state, filters);

  if (rows.length === 0) {
    return <p className="card p-6 text-center text-sm">No managers match the current filters.</p>;
  }

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[60rem] border-collapse">
          <caption className="sr-only">Manager completion</caption>
          <thead>
            <tr>
              {['Manager', 'Team', 'Total', 'Allocated', 'Unallocated', 'Completion', 'Status', 'Last updated', 'Submitted', 'Action'].map((h) => (
                <th key={h} scope="col" className="th">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ team, manager, stats, sub }) => (
              <tr key={team.id}>
                <th scope="row" className="td text-left font-medium">
                  {manager.name}
                  <span className="block text-xs font-normal text-muted">{manager.id}</span>
                </th>
                <td className="td">{team.name}</td>
                <td className="td">{stats.total}</td>
                <td className="td">{stats.allocated}</td>
                <td className="td">{stats.unallocated}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-label={`${manager.name} completion`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={stats.percent}
                      className="h-2 w-20 overflow-hidden rounded bg-line"
                    >
                      <div className="h-full bg-accent" style={{ width: `${stats.percent}%` }} />
                    </div>
                    <span className="font-medium">{stats.percent}%</span>
                  </div>
                </td>
                <td className="td">
                  <StatusBadge status={sub.status} />
                </td>
                <td className="td">{sub.lastUpdated ? formatDateTime(sub.lastUpdated) : '–'}</td>
                <td className="td">{sub.submittedAt ? formatDateTime(sub.submittedAt) : '–'}</td>
                <td className="td">
                  {sub.status === 'Confirmed' ? (
                    <div className="space-y-1">
                      <button type="button" className="btn-secondary" onClick={() => setReopenTeam(team.id)}>
                        Reopen submission
                      </button>
                      {sub.reopenRequestedAt && (
                        <p className="max-w-[14rem] text-xs text-warn-fg">
                          ▲ Manager asked to reopen ({formatDateTime(sub.reopenRequestedAt)}): {sub.reopenReason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">–</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reopenTeam && (
        <ConfirmDialog
          title="Reopen this submission?"
          confirmLabel="Reopen submission"
          message={
            <p>
              The manager will be able to edit their allocations again and must resubmit. Their existing allocations are kept.
            </p>
          }
          onCancel={() => setReopenTeam(null)}
          onConfirm={() => {
            adminReopen(reopenTeam);
            setReopenTeam(null);
          }}
        />
      )}
    </>
  );
}
