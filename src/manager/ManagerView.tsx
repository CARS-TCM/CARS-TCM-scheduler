import { useState } from 'react';
import { sessions as allSessions } from '../data/sampleData';
import { AccessDenied } from '../components/AccessDenied';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Tabs } from '../components/Tabs';
import { formatDateTime, timeZoneLabel } from '../lib/dates';
import { byStart, managerById, openRequests, submissionFor, teamById, teamStats, undoCountFor } from '../lib/rules';
import { useStore } from '../store/AppStore';
import { Board } from './Board';
import { MyRequests, RequestFormModal } from './RequestPanels';
import { ReviewDialog } from './ReviewDialog';

type Dialog = null | 'review' | 'submit' | 'request' | 'reopen';

export function ManagerView() {
  const { state, actor, undo, saveDraft, requestReopen } = useStore();
  const [tab, setTab] = useState<'board' | 'requests'>('board');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  if (actor.role !== 'manager') return <AccessDenied needs="People Manager" />;

  const manager = managerById(actor.managerId);
  const team = teamById(actor.teamId);
  // Defence in depth: only people who report to this manager AND belong to this team.
  const employees = state.employees.filter((e) => e.managerId === actor.managerId && e.teamId === actor.teamId);
  const sessions = allSessions.filter((s) => s.eligibleTeamIds.includes(actor.teamId)).sort(byStart);
  const sub = submissionFor(state, actor.teamId);
  const readOnly = sub.status === 'Confirmed';
  const stats = teamStats(state, actor.teamId);
  const myRequests = state.requests.filter((r) => r.managerId === actor.managerId);
  const pending = openRequests(state, actor.managerId).length;
  const tz = timeZoneLabel();

  const sendReopen = () => {
    const res = requestReopen(reason);
    if (res.ok) {
      setDialog(null);
      setReason('');
      setReasonError('');
    } else {
      setReasonError(res.error);
    }
  };

  return (
    <div className="space-y-5">
      <section aria-labelledby="mgr-h" className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="mgr-h" className="text-xl font-semibold">
              {team?.name} – training allocations
            </h2>
            <p className="text-sm text-muted">
              Manager: {manager?.name} ({manager?.id}) · You can only see and allocate your own team members.
            </p>
          </div>
          <div className="text-right text-sm">
            <StatusBadge status={sub.status} />
            <p className="mt-1 text-muted">
              {sub.dirty && <span className="font-semibold text-warn-fg">▲ Unsaved changes · </span>}
              {sub.draftSavedAt && !readOnly && !sub.dirty && `Draft saved ${formatDateTime(sub.draftSavedAt)} ${tz}`}
              {!sub.draftSavedAt && !sub.dirty && !readOnly && 'No changes yet'}
            </p>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[
            ['Team members', stats.total],
            ['Allocated', stats.allocated],
            ['Unallocated', stats.unallocated],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-line bg-surface-2 p-2">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        {readOnly && (
          <div role="status" className="mt-3 rounded-md border border-ok-line bg-ok-bg p-3 text-sm text-ok-fg">
            <p className="font-semibold">✓ Confirmed – this board is read-only</p>
            <p>
              Submitted {sub.submittedAt ? `${formatDateTime(sub.submittedAt)} ${tz}` : ''}. Only the administrator can reopen it.
            </p>
            {sub.reopenRequestedAt ? (
              <p className="mt-1">
                ℹ You asked for it to be reopened on {formatDateTime(sub.reopenRequestedAt)} ({sub.reopenReason}). Waiting for the administrator.
              </p>
            ) : (
              <button type="button" className="btn-secondary mt-2" onClick={() => setDialog('reopen')}>
                Request that the administrator reopen this
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => undo()} disabled={readOnly || undoCountFor(state, actor.teamId) === 0}>
            ↶ Undo last change
          </button>
          <button type="button" className="btn-secondary" onClick={() => saveDraft()} disabled={readOnly}>
            Save as draft
          </button>
          <button type="button" className="btn-secondary" onClick={() => setDialog('review')}>
            Review allocations
          </button>
          <button type="button" className="btn-primary" onClick={() => setDialog('submit')} disabled={readOnly}>
            Confirm and submit…
          </button>
          <button type="button" className="btn-secondary sm:ml-auto" onClick={() => setDialog('request')}>
            Request team member to be added
          </button>
        </div>
      </section>

      <Tabs
        label="Manager sections"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'board', label: 'Allocation board' },
          { id: 'requests', label: `My requests (${myRequests.length}${pending ? `, ${pending} open` : ''})` },
        ]}
      >
        {tab === 'board' ? (
          <Board employees={employees} sessions={sessions} readOnly={readOnly} />
        ) : (
          <MyRequests onNew={() => setDialog('request')} />
        )}
      </Tabs>

      {(dialog === 'review' || dialog === 'submit') && <ReviewDialog mode={dialog} onClose={() => setDialog(null)} />}
      {dialog === 'request' && <RequestFormModal onClose={() => setDialog(null)} />}
      {dialog === 'reopen' && (
        <Modal
          title="Ask the administrator to reopen"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={sendReopen}>
                Send request
              </button>
            </>
          }
        >
          <p className="mb-2 text-sm">
            You can’t unlock a confirmed submission yourself. Tell the administrator why you need changes.
          </p>
          <label htmlFor="reopen-reason" className="label">
            Reason
          </label>
          <textarea
            id="reopen-reason"
            rows={3}
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={reasonError ? true : undefined}
            aria-describedby={reasonError ? 'reopen-err' : undefined}
            data-autofocus
          />
          {reasonError && (
            <p id="reopen-err" className="mt-1 text-sm font-medium text-bad-fg">
              ✕ {reasonError}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
