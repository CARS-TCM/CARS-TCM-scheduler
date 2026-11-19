export type Role = 'manager' | 'admin';
export type DeliveryMethod = 'In person' | 'Microsoft Teams';
export type SessionStatus = 'Available' | 'Nearly Full' | 'Full';
export type SubmissionStatus = 'Not Started' | 'Draft' | 'Confirmed';
export type RequestStatus =
  | 'Submitted'
  | 'Under review'
  | 'Added'
  | 'Declined'
  | 'More information required';

/* ---------- Master data (maintained by the Training Administrator outside the app) ---------- */

export interface Team {
  id: string;
  name: string;
  managerId: string;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  teamId: string;
}

export interface Employee {
  id: string;
  name: string;
  teamId: string;
  managerId: string;
  email: string;
  /** Optional scheduling note, e.g. part-time days or leave. */
  note?: string;
}

export interface TrainingSession {
  id: string;
  name: string;
  /** ISO 8601 instants. They are displayed in the viewer's local timezone. */
  startsAt: string;
  endsAt: string;
  method: DeliveryMethod;
  /** Room/address for in-person sessions, meeting URL for Microsoft Teams. */
  location: string;
  facilitator: string;
  capacity: number;
  /** Teams whose managers may allocate people to this session. */
  eligibleTeamIds: string[];
}

/* ---------- Working data (changed by the app) ---------- */

export interface Submission {
  teamId: string;
  status: SubmissionStatus;
  /** True when there are changes since the last "Save draft". */
  dirty: boolean;
  lastUpdated?: string;
  draftSavedAt?: string;
  submittedAt?: string;
  reopenRequestedAt?: string;
  reopenReason?: string;
}

export interface TeamRequest {
  id: string;
  managerId: string;
  teamId: string;
  name: string;
  employeeId: string;
  email: string;
  comments: string;
  status: RequestStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  addedEmployeeId?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface UndoEntry {
  teamId: string;
  employeeId: string;
  from: string | null;
  to: string | null;
  at: string;
}

export interface AppState {
  employees: Employee[];
  /** employeeId -> sessionId. Missing key means unallocated. */
  allocations: Record<string, string>;
  submissions: Record<string, Submission>;
  requests: TeamRequest[];
  audit: AuditEntry[];
  undo: UndoEntry[];
}

export interface ManagerActor {
  role: 'manager';
  managerId: string;
  teamId: string;
  name: string;
}

export interface AdminActor {
  role: 'admin';
  name: string;
}

export type Actor = ManagerActor | AdminActor;

export type Result = { ok: true; state: AppState; message: string } | { ok: false; error: string };
