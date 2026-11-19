import { useState } from 'react';
import { managers, sessions, teams } from '../data/sampleData';
import { ConfirmDialog } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatDateTime, formatTime } from '../lib/dates';
import { filterEmployees, type AdminFilters } from '../lib/filters';
import { allocatedCount, allocationLabel, byStart, sessionById, submissionFor, teamById } from '../lib/rules';
import { useStore } from '../store/AppStore';

export function EmployeeAllocations({ filters }: { filters: AdminFilters }) {
  const { state, moveEmployee, adminReopen } = useStore();
  const [pendingMove, setPendingMove] = useState<{ employeeId: string; sessionId: string | null } | null>(null);
  const [reopenTeam, setReopenTeam] = useState<string | null>(null);
  const rows = filterEmployees(state, filters);
  const sorted = [...sessions].sort(byStart);
  const confirmedTeams = teams.filter((t) => submissionFor(state, t.id).status === 'Confirmed');

  const requestMove = (employeeId: string, sessionId: string | null) => {
    const emp = state.employees.find((e) => e.id === employeeId);
    if (emp && submissionFor(state, emp.teamId).status === 'Confirmed') setPendingMove({ employeeId, sessionId });
    else moveEmployee(employeeId, sessionId);
  };

  const pendingEmp = pendingMove && state.employees.find((e) => e.id === pendingMove.employeeId);

  return (
    <div className="space-y-4">
      <section aria-labelledby="reopen-h" className="card p-4">
        <h3 id="reopen-h" className="font-semibold">
          Confirmed submissions
        </h3>
        {confirmedTeams.length === 0 ? (
          <p className="text-sm text-muted">No manager has confirmed yet.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-3">
            {confirmedTeams.map((t) => {
              const sub = submissionFor(state, t.id);
              const mgr = managers.find((m) => m.id === t.managerId);
              return (
                <li key={t.id} className="rounded-md border border-line p-3 text-sm">
                  <p className="font-medium">
                    {t.name} – {mgr?.name}
                  </p>
                  <p className="text-xs text-muted">Submitted {sub.submittedAt ? formatDateTime(sub.submittedAt) : ''}</p>
                  {sub.reopenRequestedAt && <p className="text-xs text-warn-fg">▲ Reopen requested: {sub.reopenReason}</p>}
                  <button type="button" className="btn-secondary mt-2" onClick={() => setReopenTeam(t.id)}>
                    Reopen {t.name} submission
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {rows.length === 0 ? (
        <p className="card p-6 text-center text-sm">No employees match the current filters. Try clearing a filter or changing your search.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[62rem] border-collapse">
            <caption className="sr-only">Employee allocations ({rows.length} shown)</caption>
            <thead>
              <tr>
                {['Employee', 'Team', 'Manager', 'Allocated session', 'Status', 'Submission', 'Administrative correction'].map((h) => (
                  <th key={h} scope="col" className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const sid = state.allocations[e.id] ?? '';
                const s = sid ? sessionById(sid) : undefined;
                const mgr = managers.find((m) => m.id === e.managerId);
                return (
                  <tr key={e.id}>
                    <th scope="row" className="td text-left font-medium">
                      {e.name}
                      <span className="block text-xs font-normal text-muted">{e.id}</span>
                    </th>
                    <td className="td">{teamById(e.teamId)?.name}</td>
                    <td className="td">{mgr?.name}</td>
                    <td className="td">
                      {s ? (
                        <>
                          {s.name}
                          <span className="block text-xs text-muted">
                            {formatDate(s.startsAt)} {formatTime(s.startsAt)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">Not allocated</span>
                      )}
                    </td>
                    <td className="td">
                      <StatusBadge status={allocationLabel(state, e)} />
                    </td>
                    <td className="td">
                      <StatusBadge status={submissionFor(state, e.teamId).status} />
                    </td>
                    <td className="td">
                      <label htmlFor={`adm-${e.id}`} className="sr-only">
                        Move {e.name} to
                      </label>
                      <select id={`adm-${e.id}`} className="input py-1" value={sid} onChange={(ev) => requestMove(e.id, ev.target.value || null)}>
                        <option value="">Unallocated</option>
                        {sorted.map((x) => {
                          const n = allocatedCount(state, x.id);
                          const full = n >= x.capacity && x.id !== sid;
                          const approved = x.eligibleTeamIds.includes(e.teamId);
                          return (
                            <option key={x.id} value={x.id} disabled={full}>
                              {x.name} – {formatDate(x.startsAt)} ({full ? 'full' : `${x.capacity - n} left`})
                              {approved ? '' : ' – override: not approved for team'}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-3 py-2 text-xs text-muted">
            Showing {rows.length} of {state.employees.length} employees. Corrections are recorded in the audit log.
          </p>
        </div>
      )}

      {pendingMove && pendingEmp && (
        <ConfirmDialog
          title="Change a confirmed allocation?"
          confirmLabel="Make correction"
          message={
            <p>
              {pendingEmp.name}’s team has already confirmed its submission. This administrative correction will change their
              allocation to{' '}
              <strong>{pendingMove.sessionId ? sessionById(pendingMove.sessionId)?.name : 'Unallocated'}</strong> and is recorded in the audit log.
            </p>
          }
          onCancel={() => setPendingMove(null)}
          onConfirm={() => {
            moveEmployee(pendingMove.employeeId, pendingMove.sessionId);
            setPendingMove(null);
          }}
        />
      )}
      {reopenTeam && (
        <ConfirmDialog
          title="Reopen this submission?"
          confirmLabel="Reopen submission"
          message={<p>The manager will be able to edit their allocations again and must resubmit.</p>}
          onCancel={() => setReopenTeam(null)}
          onConfirm={() => {
            adminReopen(reopenTeam);
            setReopenTeam(null);
          }}
        />
      )}
    </div>
  );
}
