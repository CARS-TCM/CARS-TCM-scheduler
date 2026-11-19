/**
 * FICTIONAL SAMPLE DATA – no real people, teams or systems.
 *
 * In production this master data would be supplied by an approved Council
 * data source and would be read-only to the app. It is kept in this file,
 * separate from every UI component, so it can be swapped for an API client.
 */
import type {
  AppState,
  Employee,
  Manager,
  Submission,
  Team,
  TeamRequest,
  TrainingSession,
} from '../types';

export const COUNCIL_NAME = 'Riverbend Regional Council (fictional)';

export const ADMIN = {
  id: 'A001',
  name: 'Jordan Ellis',
  title: 'TRACE Training Coordinator',
} as const;

export const teams: Team[] = [
  { id: 'T-CS', name: 'Customer Service', managerId: 'M001' },
  { id: 'T-RD', name: 'Roads & Drainage', managerId: 'M002' },
  { id: 'T-PK', name: 'Parks & Open Spaces', managerId: 'M003' },
  { id: 'T-PA', name: 'Planning & Approvals', managerId: 'M004' },
];

export const managers: Manager[] = [
  { id: 'M001', name: 'Priya Nair', email: 'priya.nair@riverbend.example', teamId: 'T-CS' },
  { id: 'M002', name: 'Daniel Okafor', email: 'daniel.okafor@riverbend.example', teamId: 'T-RD' },
  { id: 'M003', name: 'Mei-Lin Tran', email: 'mei-lin.tran@riverbend.example', teamId: 'T-PK' },
  { id: 'M004', name: 'Tom Whitaker', email: 'tom.whitaker@riverbend.example', teamId: 'T-PA' },
];

const TEAMS_LINK = 'https://teams.microsoft.com/l/meetup-join/FICTIONAL-TRACE-R8';

export const sessions: TrainingSession[] = [
  {
    id: 'S01',
    name: 'TRACE R8 Foundations – Session 1',
    startsAt: '2026-12-01T09:00:00+10:00',
    endsAt: '2026-12-01T12:00:00+10:00',
    method: 'In person',
    location: 'Training Room 1, Civic Centre',
    facilitator: 'Hannah Brooks',
    capacity: 6,
    eligibleTeamIds: ['T-CS', 'T-RD'],
  },
  {
    id: 'S02',
    name: 'TRACE R8 Foundations – Session 2',
    startsAt: '2026-12-01T13:00:00+10:00',
    endsAt: '2026-12-01T16:00:00+10:00',
    method: 'Microsoft Teams',
    location: `${TEAMS_LINK}-S02`,
    facilitator: 'Hannah Brooks',
    capacity: 8,
    eligibleTeamIds: ['T-CS', 'T-RD', 'T-PK'],
  },
  {
    id: 'S03',
    name: 'TRACE R8 Foundations – Session 3',
    startsAt: '2026-12-03T09:00:00+10:00',
    endsAt: '2026-12-03T12:00:00+10:00',
    method: 'In person',
    location: 'Training Room 2, Civic Centre',
    facilitator: 'Marcus Lee',
    capacity: 5,
    eligibleTeamIds: ['T-PK', 'T-PA'],
  },
  {
    id: 'S04',
    name: 'TRACE R8 Foundations – Session 4',
    startsAt: '2026-12-03T13:00:00+10:00',
    endsAt: '2026-12-03T16:00:00+10:00',
    method: 'Microsoft Teams',
    location: `${TEAMS_LINK}-S04`,
    facilitator: 'Marcus Lee',
    capacity: 10,
    eligibleTeamIds: ['T-CS', 'T-RD', 'T-PK', 'T-PA'],
  },
  {
    id: 'S05',
    name: 'Case Management Deep Dive',
    startsAt: '2026-12-08T09:30:00+10:00',
    endsAt: '2026-12-08T12:30:00+10:00',
    method: 'In person',
    location: 'Library Meeting Room, Central Library',
    facilitator: 'Hannah Brooks',
    capacity: 6,
    eligibleTeamIds: ['T-CS', 'T-PA'],
  },
  {
    id: 'S06',
    name: 'Approvals & Workflows',
    startsAt: '2026-12-08T13:30:00+10:00',
    endsAt: '2026-12-08T16:30:00+10:00',
    method: 'Microsoft Teams',
    location: `${TEAMS_LINK}-S06`,
    facilitator: 'Marcus Lee',
    capacity: 6,
    eligibleTeamIds: ['T-RD', 'T-PA'],
  },
  {
    id: 'S07',
    name: 'Field Operations on Mobile',
    startsAt: '2026-12-10T08:30:00+10:00',
    endsAt: '2026-12-10T11:30:00+10:00',
    method: 'In person',
    location: 'Depot Training Room, Works Depot',
    facilitator: 'Sofia Alvarez',
    capacity: 5,
    eligibleTeamIds: ['T-RD', 'T-PK'],
  },
  {
    id: 'S08',
    name: 'Refresher & Q&A',
    startsAt: '2026-12-15T10:00:00+10:00',
    endsAt: '2026-12-15T12:00:00+10:00',
    method: 'Microsoft Teams',
    location: `${TEAMS_LINK}-S08`,
    facilitator: 'Sofia Alvarez',
    capacity: 12,
    eligibleTeamIds: ['T-CS', 'T-RD', 'T-PK', 'T-PA'],
  },
];

const mail = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ +/g, '.')}@riverbend.example`;

function emp(id: string, name: string, managerId: string, teamId: string, note?: string): Employee {
  return { id, name, managerId, teamId, email: mail(name), ...(note ? { note } : {}) };
}

const employees: Employee[] = [
  // Customer Service – Priya Nair
  emp('E1001', 'Aisha Rahman', 'M001', 'T-CS'),
  emp('E1002', 'Ben Carter', 'M001', 'T-CS'),
  emp('E1003', 'Chloe Nguyen', 'M001', 'T-CS'),
  emp('E1004', 'Dylan Foster', 'M001', 'T-CS'),
  emp('E1005', 'Eva Lindqvist', 'M001', 'T-CS'),
  emp('E1006', 'Farid Haddad', 'M001', 'T-CS'),
  emp('E1007', "Grace O'Donnell", 'M001', 'T-CS', 'On leave 7–11 Dec – avoid the 8 Dec sessions'),
  // Roads & Drainage – Daniel Okafor
  emp('E2001', 'Harry Wilson', 'M002', 'T-RD'),
  emp('E2002', 'Isla McKenzie', 'M002', 'T-RD'),
  emp('E2003', 'Jack Pereira', 'M002', 'T-RD'),
  emp('E2004', 'Kavya Iyer', 'M002', 'T-RD'),
  emp('E2005', 'Liam Gallagher', 'M002', 'T-RD'),
  emp('E2006', 'Maria Santos', 'M002', 'T-RD', 'Night shift – afternoon sessions preferred'),
  // Parks & Open Spaces – Mei-Lin Tran
  emp('E3001', 'Noah Bennett', 'M003', 'T-PK'),
  emp('E3002', 'Olivia Tupou', 'M003', 'T-PK'),
  emp('E3003', 'Pavel Novak', 'M003', 'T-PK'),
  emp('E3004', 'Quinn Murphy', 'M003', 'T-PK'),
  emp('E3005', 'Rosa Delgado', 'M003', 'T-PK'),
  emp('E3006', 'Sam Whitfield', 'M003', 'T-PK', 'Part-time – available Tuesday to Thursday only'),
  // Planning & Approvals – Tom Whitaker
  emp('E4001', 'Tara Singh', 'M004', 'T-PA'),
  emp('E4002', 'Umar Khalid', 'M004', 'T-PA'),
  emp('E4003', 'Violet Chen', 'M004', 'T-PA'),
  emp('E4004', 'Wes Donnelly', 'M004', 'T-PA'),
  emp('E4005', 'Xiu Ying Lau', 'M004', 'T-PA'),
  emp('E4006', 'Yusuf Demir', 'M004', 'T-PA'),
  emp('E4007', 'Zoe Hargreaves', 'M004', 'T-PA'),
];

const seedAllocations: Record<string, string> = {
  // Planning & Approvals – already confirmed
  E4001: 'S03',
  E4002: 'S03',
  E4003: 'S03',
  E4004: 'S03', // S03 is now 4/5 = Nearly Full
  E4005: 'S06',
  E4006: 'S06',
  E4007: 'S04',
  // Roads & Drainage – draft in progress
  E2001: 'S01',
  E2002: 'S01',
  E2003: 'S06',
  E2004: 'S07',
};

const seedRequests: TeamRequest[] = [
  {
    id: 'R-001',
    managerId: 'M003',
    teamId: 'T-PK',
    name: 'Sienna Park',
    employeeId: '',
    email: 'sienna.park@riverbend.example',
    comments: 'Started on 9 Nov as a casual gardener. Not on my list yet.',
    status: 'Under review',
    adminNote: 'Checking with People & Culture that her start date is confirmed.',
    createdAt: '2026-11-16T10:15:00+10:00',
    updatedAt: '2026-11-17T08:40:00+10:00',
  },
  {
    id: 'R-002',
    managerId: 'M001',
    teamId: 'T-CS',
    name: 'Theo Marsh',
    employeeId: 'E1099',
    email: '',
    comments: 'Transferred to Customer Service from Libraries on 2 Nov.',
    status: 'Submitted',
    adminNote: '',
    createdAt: '2026-11-18T13:05:00+10:00',
    updatedAt: '2026-11-18T13:05:00+10:00',
  },
  {
    id: 'R-003',
    managerId: 'M004',
    teamId: 'T-PA',
    name: 'Ibrahim Yusuf',
    employeeId: '',
    email: '',
    comments: 'New town planner starting in December.',
    status: 'More information required',
    adminNote: "Please confirm Ibrahim's employee ID and start date.",
    createdAt: '2026-11-12T09:30:00+10:00',
    updatedAt: '2026-11-13T11:00:00+10:00',
  },
];

export function createInitialState(): AppState {
  const submissions: Record<string, Submission> = {};
  for (const t of teams) {
    submissions[t.id] = { teamId: t.id, status: 'Not Started', dirty: false };
  }
  submissions['T-PA'] = {
    teamId: 'T-PA',
    status: 'Confirmed',
    dirty: false,
    lastUpdated: '2026-11-17T14:20:00+10:00',
    draftSavedAt: '2026-11-17T14:10:00+10:00',
    submittedAt: '2026-11-17T14:20:00+10:00',
  };
  submissions['T-RD'] = {
    teamId: 'T-RD',
    status: 'Draft',
    dirty: false,
    lastUpdated: '2026-11-18T16:05:00+10:00',
    draftSavedAt: '2026-11-18T16:05:00+10:00',
  };

  return {
    employees: employees.map((e) => ({ ...e })),
    allocations: { ...seedAllocations },
    submissions,
    requests: seedRequests.map((r) => ({ ...r })),
    audit: [
      {
        id: 'seed',
        at: '2026-11-18T08:00:00+10:00',
        actor: 'System',
        action: 'Sample data loaded',
        detail: 'Fictional master data loaded for the TRACE Release 8 prototype.',
      },
    ],
    undo: [],
  };
}
