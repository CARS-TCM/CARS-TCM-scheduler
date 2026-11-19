import { useEffect, useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime } from '../lib/dates';
import { filterRequests, type AdminFilters } from '../lib/filters';
import { managerById, teamById } from '../lib/rules';
import { useStore } from '../store/AppStore';
import type { RequestStatus, TeamRequest } from '../types';

const STATUSES: RequestStatus[] = ['Submitted', 'Under review', 'Added', 'Declined', 'More information required'];

export function RequestsAdmin({ filters }: { filters: AdminFilters }) {
  const { state } = useStore();
  const rows = filterRequests(state, filters);
  if (rows.length === 0) {
    return <p className="card p-6 text-center text-sm">No team member requests match the current filters.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <RequestRow key={r.id} req={r} />
      ))}
    </ul>
  );
}

function RequestRow({ req }: { req: TeamRequest }) {
  const { updateRequest } = useStore();
  const [status, setStatus] = useState<RequestStatus>(req.status);
  const [note, setNote] = useState(req.adminNote);
  useEffect(() => {
    setStatus(req.status);
    setNote(req.adminNote);
  }, [req.status, req.adminNote]);
  const locked = req.status === 'Added';

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">
            {req.id} – {req.name}
          </h3>
          <p className="text-sm text-muted">
            {teamById(req.teamId)?.name} · Manager {managerById(req.managerId)?.name} · Submitted {formatDateTime(req.createdAt)}
          </p>
        </div>
        <StatusBadge status={req.status} />
      </div>
      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="inline text-muted">Employee ID: </dt>
          <dd className="inline">{req.employeeId || 'Not provided'}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Work email: </dt>
          <dd className="inline">{req.email || 'Not provided'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="inline text-muted">Manager’s comments: </dt>
          <dd className="inline">{req.comments}</dd>
        </div>
        {req.addedEmployeeId && (
          <div className="sm:col-span-2 text-ok-fg">
            ✓ Employee record {req.addedEmployeeId} created in the manager’s unallocated list.
          </div>
        )}
      </dl>
      <div className="mt-3 grid gap-3 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`rs-${req.id}`} className="label">
            Status
          </label>
          <select id={`rs-${req.id}`} className="input" value={status} disabled={locked} onChange={(e) => setStatus(e.target.value as RequestStatus)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`rn-${req.id}`} className="label">
            Note (visible to the manager)
          </label>
          <input id={`rn-${req.id}`} className="input" value={note} disabled={locked} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={locked || (status === req.status && note === req.adminNote)}
          onClick={() => updateRequest(req.id, status, note)}
        >
          Update request
        </button>
      </div>
    </li>
  );
}
