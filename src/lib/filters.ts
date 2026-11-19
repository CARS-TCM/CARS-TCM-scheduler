import { managers, sessions, teams } from '../data/sampleData';
import type { AppState, Employee, SubmissionStatus, TeamRequest, TrainingSession } from '../types';
import { localDateKey } from './dates';
import { byStart, managerForTeam, sessionById, submissionFor, teamStats } from './rules';

export interface AdminFilters {
  managerId: string;
  teamId: string;
  sessionId: string;
  /** YYYY-MM-DD, as produced by <input type="date">. */
  date: string;
  submissionStatus: '' | SubmissionStatus;
  allocationStatus: '' | 'Allocated' | 'Unallocated';
  search: string;
}

export const emptyFilters: AdminFilters = {
  managerId: '',
  teamId: '',
  sessionId: '',
  date: '',
  submissionStatus: '',
  allocationStatus: '',
  search: '',
};

export const hasActiveFilters = (f: AdminFilters) => Object.values(f).some((v) => v !== '');

/** Employees: every filter applies. */
export function filterEmployees(state: AppState, f: AdminFilters): Employee[] {
  const q = f.search.trim().toLowerCase();
  return state.employees.filter((e) => {
    if (f.managerId && e.managerId !== f.managerId) return false;
    if (f.teamId && e.teamId !== f.teamId) return false;
    const sid = state.allocations[e.id];
    if (f.sessionId && sid !== f.sessionId) return false;
    if (f.date) {
      const s = sid ? sessionById(sid) : undefined;
      if (!s || localDateKey(s.startsAt) !== f.date) return false;
    }
    if (f.submissionStatus && submissionFor(state, e.teamId).status !== f.submissionStatus) return false;
    if (f.allocationStatus === 'Allocated' && !sid) return false;
    if (f.allocationStatus === 'Unallocated' && sid) return false;
    if (q && !e.name.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Sessions: manager, team (eligibility), session and date filters apply. */
export function filterSessions(state: AppState, f: AdminFilters): TrainingSession[] {
  void state;
  const managerTeam = f.managerId ? managers.find((m) => m.id === f.managerId)?.teamId : undefined;
  return sessions
    .filter((s) => {
      if (f.sessionId && s.id !== f.sessionId) return false;
      if (f.date && localDateKey(s.startsAt) !== f.date) return false;
      if (f.teamId && !s.eligibleTeamIds.includes(f.teamId)) return false;
      if (managerTeam && !s.eligibleTeamIds.includes(managerTeam)) return false;
      return true;
    })
    .sort(byStart);
}

/** Teams / managers: manager, team and submission-status filters apply. */
export function filterTeams(state: AppState, f: AdminFilters) {
  return teams.filter((t) => {
    if (f.managerId && t.managerId !== f.managerId) return false;
    if (f.teamId && t.id !== f.teamId) return false;
    if (f.submissionStatus && submissionFor(state, t.id).status !== f.submissionStatus) return false;
    return true;
  });
}

export function completionRows(state: AppState, f: AdminFilters) {
  return filterTeams(state, f).map((team) => {
    const manager = managers.find((m) => m.id === team.managerId) ?? managerForTeam(team.id)!;
    const stats = teamStats(state, team.id);
    const sub = submissionFor(state, team.id);
    return { team, manager, stats, sub };
  });
}

/** Requests: manager, team and search filters apply. */
export function filterRequests(state: AppState, f: AdminFilters): TeamRequest[] {
  const q = f.search.trim().toLowerCase();
  return state.requests.filter((r) => {
    if (f.managerId && r.managerId !== f.managerId) return false;
    if (f.teamId && r.teamId !== f.teamId) return false;
    if (q && !r.name.toLowerCase().includes(q) && !r.employeeId.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}
