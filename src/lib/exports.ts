/**
 * Builds CSV tables from the app's in-memory sample data, respecting the admin's current filters.
 * NOTE: real exports contain personal information – in production they need server-side
 * authorisation, logging and a retention policy.
 */
import type { AppState } from '../types';
import { formatDate, formatTime, localDateKey } from './dates';
import {
  completionRows,
  filterEmployees,
  filterRequests,
  filterSessions,
  type AdminFilters,
} from './filters';
import { toCsv } from './csv';
import {
  allocationLabel,
  allocatedCount,
  managerById,
  sessionById,
  submissionFor,
  teamById,
} from './rules';

export type ExportKind = 'allocations' | 'unallocated' | 'attendance' | 'completion' | 'requests';

export const EXPORT_OPTIONS: { kind: ExportKind; label: string }[] = [
  { kind: 'allocations', label: 'Employee allocations' },
  { kind: 'unallocated', label: 'Unallocated employees' },
  { kind: 'attendance', label: 'Session attendance lists' },
  { kind: 'completion', label: 'Manager completion' },
  { kind: 'requests', label: 'Team member requests' },
];

export interface ExportTable {
  filename: string;
  columns: string[];
  rows: (string | number)[][];
}

const dash = (v?: string) => v ?? '';

export function buildExport(kind: ExportKind, state: AppState, f: AdminFilters): ExportTable {
  const stamp = localDateKey(new Date().toISOString()).replace(/-/g, '');
  const filename = `trace-r8-${kind}-${stamp}.csv`;

  switch (kind) {
    case 'allocations':
    case 'unallocated': {
      let emps = filterEmployees(state, f);
      if (kind === 'unallocated') emps = emps.filter((e) => !state.allocations[e.id]);
      const columns = [
        'Employee name', 'Employee ID', 'Team', 'Manager', 'Manager ID', 'Session', 'Session date',
        'Start', 'Finish', 'Delivery method', 'Location / Teams link', 'Facilitator',
        'Allocation status', 'Submission status',
      ];
      const rows = emps.map((e) => {
        const s = state.allocations[e.id] ? sessionById(state.allocations[e.id]) : undefined;
        return [
          e.name, e.id, teamById(e.teamId)?.name ?? '', managerById(e.managerId)?.name ?? '', e.managerId,
          s?.name ?? '', s ? formatDate(s.startsAt) : '', s ? formatTime(s.startsAt) : '',
          s ? formatTime(s.endsAt) : '', s?.method ?? '', s?.location ?? '', s?.facilitator ?? '',
          allocationLabel(state, e), submissionFor(state, e.teamId).status,
        ];
      });
      return { filename, columns, rows };
    }

    case 'attendance': {
      const sess = filterSessions(state, f);
      const allowed = new Set(filterEmployees({ ...state }, { ...f, sessionId: '', date: '' }).map((e) => e.id));
      const columns = [
        'Session', 'Date', 'Start', 'Finish', 'Delivery method', 'Location / Teams link', 'Facilitator',
        'Employee name', 'Employee ID', 'Team', 'Manager', 'Submission status',
      ];
      const rows: (string | number)[][] = [];
      for (const s of sess) {
        const attendees = state.employees.filter((e) => state.allocations[e.id] === s.id && allowed.has(e.id));
        for (const e of attendees) {
          rows.push([
            s.name, formatDate(s.startsAt), formatTime(s.startsAt), formatTime(s.endsAt), s.method,
            s.location, s.facilitator, e.name, e.id, teamById(e.teamId)?.name ?? '',
            managerById(e.managerId)?.name ?? '', submissionFor(state, e.teamId).status,
          ]);
        }
      }
      void allocatedCount;
      return { filename, columns, rows };
    }

    case 'completion': {
      const columns = [
        'Manager', 'Manager ID', 'Team', 'Total employees', 'Allocated', 'Unallocated',
        'Completion %', 'Status', 'Last updated', 'Submitted',
      ];
      const rows = completionRows(state, f).map(({ team, manager, stats, sub }) => [
        manager.name, manager.id, team.name, stats.total, stats.allocated, stats.unallocated,
        `${stats.percent}%`, sub.status,
        sub.lastUpdated ? `${formatDate(sub.lastUpdated)} ${formatTime(sub.lastUpdated)}` : '',
        sub.submittedAt ? `${formatDate(sub.submittedAt)} ${formatTime(sub.submittedAt)}` : '',
      ]);
      return { filename, columns, rows };
    }

    case 'requests': {
      const columns = [
        'Request ID', 'Employee name', 'Employee ID', 'Work email', 'Team', 'Manager', 'Status',
        'Administrator note', 'Comments', 'Submitted', 'Last updated',
      ];
      const rows = filterRequests(state, f).map((r) => [
        r.id, r.name, dash(r.employeeId), dash(r.email), teamById(r.teamId)?.name ?? '',
        managerById(r.managerId)?.name ?? '', r.status, r.adminNote, r.comments,
        `${formatDate(r.createdAt)} ${formatTime(r.createdAt)}`,
        `${formatDate(r.updatedAt)} ${formatTime(r.updatedAt)}`,
      ]);
      return { filename, columns, rows };
    }
  }
}

export const exportToCsv = (kind: ExportKind, state: AppState, f: AdminFilters) => {
  const t = buildExport(kind, state, f);
  return { ...t, csv: toCsv(t.columns, t.rows) };
};
