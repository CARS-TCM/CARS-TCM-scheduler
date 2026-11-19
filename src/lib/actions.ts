/**
 * All state changes live here as pure functions: (state, actor, input) -> Result.
 *
 * Every function re-checks the actor's role and ownership. In production these
 * same rules MUST be enforced on a server; checks in the browser are a usability
 * aid only and can be bypassed by anyone with developer tools.
 */
import type { Actor, AppState, AuditEntry, Employee, RequestStatus, Result, Submission, TeamRequest } from '../types';
import {
  allocatedCount,
  sessionById,
  submissionFor,
  teamById,
  teamStats,
} from './rules';

const NOT_ALLOWED = 'You do not have permission to do that.';
const fail = (error: string): Result => ({ ok: false, error });
const ok = (state: AppState, message: string): Result => ({ ok: true, state, message });
const nowIso = () => new Date().toISOString();

const actorLabel = (a: Actor) =>
  a.role === 'manager' ? `${a.name} (People Manager)` : `${a.name} (Training Administrator)`;

function withAudit(state: AppState, actor: Actor, action: string, detail: string, at: string): AppState {
  const entry: AuditEntry = {
    id: `${at}#${Math.random().toString(36).slice(2, 8)}`,
    at,
    actor: actorLabel(actor),
    action,
    detail,
  };
  return { ...state, audit: [entry, ...state.audit].slice(0, 500) };
}

function patchSubmission(state: AppState, teamId: string, patch: Partial<Submission>): AppState {
  const current = submissionFor(state, teamId);
  return { ...state, submissions: { ...state.submissions, [teamId]: { ...current, ...patch } } };
}

/* ------------------------------------------------------------------ */
/* Allocation                                                          */
/* ------------------------------------------------------------------ */

export function moveEmployee(
  state: AppState,
  actor: Actor,
  employeeId: string,
  targetSessionId: string | null,
  opts: { record?: boolean; label?: string } = {},
): Result {
  const record = opts.record ?? true;
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return fail('That team member could not be found.');

  if (actor.role === 'manager') {
    if (emp.managerId !== actor.managerId || emp.teamId !== actor.teamId) {
      return fail('You can only move members of your own team.');
    }
    if (submissionFor(state, emp.teamId).status === 'Confirmed') {
      return fail(
        'Your submission is confirmed and read-only. Ask the administrator to reopen it if you need changes.',
      );
    }
  }

  const from = state.allocations[employeeId] ?? null;
  if (from === targetSessionId) {
    return ok(state, ''); // nothing to do
  }

  let target = null as ReturnType<typeof sessionById>;
  if (targetSessionId !== null) {
    target = sessionById(targetSessionId);
    if (!target) return fail('That session could not be found.');
    if (actor.role === 'manager' && !target.eligibleTeamIds.includes(emp.teamId)) {
      return fail('That session is not approved for your team.');
    }
    const count = allocatedCount(state, target.id);
    if (count >= target.capacity) {
      return fail(`${target.name} is full (${count} of ${target.capacity} places taken). Choose another session.`);
    }
  }

  const allocations = { ...state.allocations };
  if (targetSessionId === null) delete allocations[employeeId];
  else allocations[employeeId] = targetSessionId;

  const at = nowIso();
  let next: AppState = { ...state, allocations };

  if (actor.role === 'manager') {
    next = patchSubmission(next, emp.teamId, { status: 'Draft', dirty: true, lastUpdated: at });
    if (record) {
      next = {
        ...next,
        undo: [...next.undo, { teamId: emp.teamId, employeeId, from, to: targetSessionId, at }].slice(-50),
      };
    }
  } else {
    next = patchSubmission(next, emp.teamId, { lastUpdated: at });
  }

  const fromName = from ? sessionById(from)?.name ?? from : 'Unallocated';
  const toName = target ? target.name : 'Unallocated';
  next = withAudit(
    next,
    actor,
    opts.label ?? (actor.role === 'admin' ? 'Administrative correction' : 'Allocation changed'),
    `${emp.name} (${emp.id}): ${fromName} → ${toName}`,
    at,
  );

  return ok(next, target ? `${emp.name} moved to ${target.name}.` : `${emp.name} returned to the unallocated list.`);
}

export function undoLast(state: AppState, actor: Actor): Result {
  if (actor.role !== 'manager') return fail(NOT_ALLOWED);
  let idx = -1;
  for (let i = state.undo.length - 1; i >= 0; i--) {
    if (state.undo[i].teamId === actor.teamId) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return fail('There is nothing to undo.');
  const entry = state.undo[idx];
  const res = moveEmployee(state, actor, entry.employeeId, entry.from, { record: false, label: 'Allocation change undone' });
  if (!res.ok) return fail(`Could not undo: ${res.error}`);
  const emp = state.employees.find((e) => e.id === entry.employeeId);
  return ok(
    { ...res.state, undo: res.state.undo.filter((_, i) => i !== idx) },
    `Undone: ${emp?.name ?? 'team member'} restored to their previous position.`,
  );
}

/* ------------------------------------------------------------------ */
/* Draft, submit, reopen                                               */
/* ------------------------------------------------------------------ */

export function saveDraft(state: AppState, actor: Actor): Result {
  if (actor.role !== 'manager') return fail(NOT_ALLOWED);
  if (submissionFor(state, actor.teamId).status === 'Confirmed') {
    return fail('Your submission is confirmed and read-only.');
  }
  const at = nowIso();
  let next = patchSubmission(state, actor.teamId, { status: 'Draft', dirty: false, draftSavedAt: at, lastUpdated: at });
  const stats = teamStats(next, actor.teamId);
  next = withAudit(next, actor, 'Draft saved', `${stats.allocated} of ${stats.total} team members allocated.`, at);
  return ok(next, 'Draft saved. You can come back and finish later.');
}

export function submitTeam(state: AppState, actor: Actor, acknowledgedUnallocated: boolean): Result {
  if (actor.role !== 'manager') return fail(NOT_ALLOWED);
  if (submissionFor(state, actor.teamId).status === 'Confirmed') return fail('This submission is already confirmed.');
  const stats = teamStats(state, actor.teamId);
  if (stats.total === 0) return fail('There are no team members to submit.');
  if (stats.unallocated > 0 && !acknowledgedUnallocated) {
    return fail('Please tick the box to acknowledge the team members who are not allocated to a session.');
  }
  const at = nowIso();
  let next = patchSubmission(state, actor.teamId, {
    status: 'Confirmed',
    dirty: false,
    submittedAt: at,
    lastUpdated: at,
    draftSavedAt: at,
    reopenRequestedAt: undefined,
    reopenReason: undefined,
  });
  next = { ...next, undo: next.undo.filter((u) => u.teamId !== actor.teamId) };
  next = withAudit(
    next,
    actor,
    'Submission confirmed',
    `${stats.allocated} of ${stats.total} allocated; ${stats.unallocated} unallocated (acknowledged).`,
    at,
  );
  return ok(next, 'Your team’s allocations are confirmed and submitted. The board is now read-only.');
}

export function requestReopen(state: AppState, actor: Actor, reason: string): Result {
  if (actor.role !== 'manager') return fail(NOT_ALLOWED);
  const sub = submissionFor(state, actor.teamId);
  if (sub.status !== 'Confirmed') return fail('Only a confirmed submission can be reopened.');
  if (sub.reopenRequestedAt) return fail('You have already asked the administrator to reopen this submission.');
  if (!reason.trim()) return fail('Please tell the administrator why you need the submission reopened.');
  const at = nowIso();
  let next = patchSubmission(state, actor.teamId, { reopenRequestedAt: at, reopenReason: reason.trim() });
  next = withAudit(next, actor, 'Reopen requested', reason.trim(), at);
  return ok(next, 'Your request to reopen has been sent to the administrator. The board stays read-only until they reopen it.');
}

export function reopenSubmission(state: AppState, actor: Actor, teamId: string): Result {
  if (actor.role !== 'admin') return fail(NOT_ALLOWED);
  const sub = submissionFor(state, teamId);
  if (sub.status !== 'Confirmed') return fail('Only a confirmed submission can be reopened.');
  const at = nowIso();
  let next = patchSubmission(state, teamId, {
    status: 'Draft',
    dirty: false,
    submittedAt: undefined,
    reopenRequestedAt: undefined,
    reopenReason: undefined,
    lastUpdated: at,
  });
  next = withAudit(next, actor, 'Submission reopened', `${teamById(teamId)?.name ?? teamId} (was submitted ${sub.submittedAt ?? 'earlier'}).`, at);
  return ok(next, `${teamById(teamId)?.name ?? 'Team'} submission reopened. The manager can edit it again.`);
}

/* ------------------------------------------------------------------ */
/* Missing team member requests                                        */
/* ------------------------------------------------------------------ */

export interface RequestForm {
  name: string;
  employeeId: string;
  email: string;
  comments: string;
}

export function validateRequestForm(f: RequestForm): Partial<Record<keyof RequestForm, string>> {
  const errors: Partial<Record<keyof RequestForm, string>> = {};
  if (!f.name.trim()) errors.name = 'Enter the employee’s name.';
  if (f.employeeId.trim() && !/^[A-Za-z0-9-]{3,12}$/.test(f.employeeId.trim())) {
    errors.employeeId = 'Employee ID should be 3–12 letters, numbers or hyphens. Leave it blank if you don’t know it.';
  }
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    errors.email = 'Enter a valid email address, or leave it blank.';
  }
  if (!f.comments.trim()) errors.comments = 'Tell the administrator why this person should be added.';
  return errors;
}

export function addRequest(state: AppState, actor: Actor, form: RequestForm): Result {
  if (actor.role !== 'manager') return fail(NOT_ALLOWED);
  const errors = validateRequestForm(form);
  const first = Object.values(errors)[0];
  if (first) return fail(first);

  const maxNum = state.requests.reduce((m, r) => Math.max(m, Number(r.id.replace(/\D/g, '')) || 0), 0);
  const id = `R-${String(maxNum + 1).padStart(3, '0')}`;
  const at = nowIso();
  const req: TeamRequest = {
    id,
    managerId: actor.managerId,
    teamId: actor.teamId,
    name: form.name.trim(),
    employeeId: form.employeeId.trim(),
    email: form.email.trim(),
    comments: form.comments.trim(),
    status: 'Submitted',
    adminNote: '',
    createdAt: at,
    updatedAt: at,
  };
  let next: AppState = { ...state, requests: [req, ...state.requests] };
  next = withAudit(next, actor, 'Team member requested', `${req.id}: ${req.name}`, at);
  return ok(
    next,
    `Request ${id} submitted. It is now in the administrator’s review queue. ${req.name} has not been added to your board yet.`,
  );
}

export function updateRequest(
  state: AppState,
  actor: Actor,
  requestId: string,
  status: RequestStatus,
  note: string,
): Result {
  if (actor.role !== 'admin') return fail(NOT_ALLOWED);
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) return fail('That request could not be found.');
  if (req.status === 'Added') return fail('This request is already marked Added, so the employee record exists.');
  if ((status === 'Declined' || status === 'More information required') && !note.trim()) {
    return fail('Add a note so the manager knows why the request was declined or what information is needed.');
  }

  const at = nowIso();
  let employees = state.employees;
  let addedEmployeeId = req.addedEmployeeId;
  let extra = '';

  if (status === 'Added') {
    const nextId =
      req.employeeId ||
      `E${
        state.employees.reduce((m, e) => (e.id.startsWith('E9') ? Math.max(m, Number(e.id.slice(1)) || 0) : m), 9000) + 1
      }`;
    if (state.employees.some((e) => e.id.toLowerCase() === nextId.toLowerCase())) {
      return fail(`Employee ID ${nextId} already exists in the master data. Update the request or choose another status.`);
    }
    const newEmp: Employee = {
      id: nextId,
      name: req.name,
      teamId: req.teamId,
      managerId: req.managerId,
      email: req.email,
      note: `Added from request ${req.id}`,
    };
    employees = [...state.employees, newEmp];
    addedEmployeeId = nextId;
    extra =
      submissionFor(state, req.teamId).status === 'Confirmed'
        ? ' Their team’s submission is confirmed, so it must be reopened before they can be allocated.'
        : ' They now appear in the manager’s unallocated list.';
  }

  const updated: TeamRequest = { ...req, status, adminNote: note.trim(), updatedAt: at, addedEmployeeId };
  let next: AppState = {
    ...state,
    employees,
    requests: state.requests.map((r) => (r.id === requestId ? updated : r)),
  };
  next = withAudit(next, actor, 'Request updated', `${req.id} (${req.name}) → ${status}${note.trim() ? `: ${note.trim()}` : ''}`, at);
  return ok(next, `Request ${req.id} updated to “${status}”.${extra}`);
}
