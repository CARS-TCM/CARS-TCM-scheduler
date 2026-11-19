/**
 * Pure read-only helpers: capacity maths, status labels and per-team statistics.
 * No React and no storage access, so everything here is easy to unit test.
 */
import { managers, sessions, teams } from '../data/sampleData';
import type {
  AppState,
  Employee,
  RequestStatus,
  SessionStatus,
  Submission,
  TrainingSession,
} from '../types';

export const NEARLY_FULL_PERCENT = 80;

export const sessionById = (id: string) => sessions.find((s) => s.id === id);
export const teamById = (id: string) => teams.find((t) => t.id === id);
export const managerById = (id: string) => managers.find((m) => m.id === id);
export const managerForTeam = (teamId: string) => managers.find((m) => m.teamId === teamId);

export const byStart = (a: TrainingSession, b: TrainingSession) =>
  new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();

export function allocatedCount(state: AppState, sessionId: string): number {
  let n = 0;
  for (const sid of Object.values(state.allocations)) if (sid === sessionId) n++;
  return n;
}

export function capacityPercent(allocated: number, capacity: number): number {
  return capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;
}

/** Full at 100%; Nearly Full at 80% or higher (integer maths avoids float edge cases). */
export function sessionStatus(allocated: number, capacity: number): SessionStatus {
  if (allocated >= capacity) return 'Full';
  if (allocated * 100 >= capacity * NEARLY_FULL_PERCENT) return 'Nearly Full';
  return 'Available';
}

export function submissionFor(state: AppState, teamId: string): Submission {
  return state.submissions[teamId] ?? { teamId, status: 'Not Started', dirty: false };
}

export type AllocationLabel = 'Unallocated' | 'Allocated (draft)' | 'Allocated (confirmed)';

export function allocationLabel(state: AppState, employee: Employee): AllocationLabel {
  if (!state.allocations[employee.id]) return 'Unallocated';
  return submissionFor(state, employee.teamId).status === 'Confirmed'
    ? 'Allocated (confirmed)'
    : 'Allocated (draft)';
}

export const teamEmployees = (state: AppState, teamId: string) =>
  state.employees.filter((e) => e.teamId === teamId);

export function sessionsUsed(state: AppState, teamId: string): { session: TrainingSession; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of teamEmployees(state, teamId)) {
    const sid = state.allocations[e.id];
    if (sid) counts.set(sid, (counts.get(sid) ?? 0) + 1);
  }
  const out: { session: TrainingSession; count: number }[] = [];
  for (const [sid, count] of counts) {
    const session = sessionById(sid);
    if (session) out.push({ session, count });
  }
  return out.sort((a, b) => byStart(a.session, b.session));
}

export function teamStats(state: AppState, teamId: string) {
  const emps = teamEmployees(state, teamId);
  const total = emps.length;
  const allocated = emps.filter((e) => state.allocations[e.id]).length;
  return {
    total,
    allocated,
    unallocated: total - allocated,
    percent: total > 0 ? Math.round((allocated / total) * 100) : 0,
  };
}

export const OPEN_REQUEST_STATUSES: RequestStatus[] = ['Submitted', 'Under review', 'More information required'];

export const openRequests = (state: AppState, managerId?: string) =>
  state.requests.filter(
    (r) => OPEN_REQUEST_STATUSES.includes(r.status) && (!managerId || r.managerId === managerId),
  );

export const undoCountFor = (state: AppState, teamId: string) =>
  state.undo.filter((u) => u.teamId === teamId).length;

export const eligibleTeamNames = (s: TrainingSession) =>
  s.eligibleTeamIds.map((id) => teamById(id)?.name ?? id).join(', ');
