import { useState } from 'react';
import { Modal } from '../components/Modal';
import { formatDate, formatTimeRange, formatWeekday } from '../lib/dates';
import { openRequests, sessionsUsed, teamEmployees, teamStats } from '../lib/rules';
import { useStore } from '../store/AppStore';

interface Props {
  mode: 'review' | 'submit';
  onClose: () => void;
}

/** "Review" shows the summary only. "Submit" adds the acknowledgement and the final confirm button. */
export function ReviewDialog({ mode, onClose }: Props) {
  const { state, actor, submit } = useStore();
  const [ack, setAck] = useState(false);
  const [error, setError] = useState('');
  if (actor.role !== 'manager') return null;

  const stats = teamStats(state, actor.teamId);
  const used = sessionsUsed(state, actor.teamId);
  const unallocated = teamEmployees(state, actor.teamId).filter((e) => !state.allocations[e.id]);
  const pending = openRequests(state, actor.managerId);
  const needsAck = stats.unallocated > 0;

  const doSubmit = () => {
    const res = submit(ack);
    if (res.ok) onClose();
    else setError(res.error);
  };

  return (
    <Modal
      wide
      title={mode === 'submit' ? 'Confirm and submit your team’s allocations' : 'Review proposed allocations'}
      onClose={onClose}
      footer={
        mode === 'submit' ? (
          <>
            <button type="button" className="btn-secondary" onClick={onClose} data-autofocus>
              Go back and keep editing
            </button>
            <button type="button" className="btn-primary" onClick={doSubmit} disabled={needsAck && !ack}>
              Confirm and submit
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={onClose} data-autofocus>
            Close
          </button>
        )
      }
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Total team members', stats.total],
          ['Allocated', stats.allocated],
          ['Unallocated', stats.unallocated],
          ['Sessions being used', used.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-surface-2 p-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-4 font-semibold">Allocations by session</h3>
      {used.length === 0 ? (
        <p className="mt-1 text-sm text-muted">No one has been allocated to a session yet.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm">
          {used.map(({ session, count }) => (
            <li key={session.id} className="rounded-md border border-line p-2">
              <p className="font-medium">
                {session.name} – {formatWeekday(session.startsAt)} {formatDate(session.startsAt)},{' '}
                {formatTimeRange(session.startsAt, session.endsAt)} ({count})
              </p>
              <p className="text-ink2">
                {teamEmployees(state, actor.teamId)
                  .filter((e) => state.allocations[e.id] === session.id)
                  .map((e) => e.name)
                  .join(', ')}
              </p>
            </li>
          ))}
        </ul>
      )}

      {unallocated.length > 0 && (
        <div className="mt-4 rounded-md border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg">
          <p className="font-semibold">▲ Not allocated ({unallocated.length})</p>
          <p>{unallocated.map((e) => e.name).join(', ')}</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mt-3 rounded-md border border-info-line bg-info-bg p-3 text-sm text-info-fg">
          <p className="font-semibold">ℹ Unresolved team member requests ({pending.length})</p>
          <p>
            {pending.map((r) => `${r.name} (${r.status})`).join(', ')}. These people are not on your board, so they are not
            included in this submission.
          </p>
        </div>
      )}

      {mode === 'submit' && (
        <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
          <p>
            After you submit, your board becomes <strong>read-only</strong> and the submission time is recorded. Only the
            administrator can reopen it.
          </p>
          {needsAck && (
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 h-4 w-4" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span>
                I acknowledge that <strong>{unallocated.length}</strong> team member{unallocated.length === 1 ? ' is' : 's are'} not
                allocated to a session.
              </span>
            </label>
          )}
          {error && (
            <p role="alert" className="font-semibold text-bad-fg">
              ✕ {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
