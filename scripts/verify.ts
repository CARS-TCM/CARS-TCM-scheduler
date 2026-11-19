/**
 * Logic checks for the pure business rules (no browser, no React).
 * Run with:  npm run verify
 */
import { createInitialState, sessions } from '../src/data/sampleData';
import type { Actor, AppState, ManagerActor, Result } from '../src/types';
import * as A from '../src/lib/actions';
import { csvCell, toCsv } from '../src/lib/csv';
import { exportToCsv } from '../src/lib/exports';
import { completionRows, emptyFilters, filterEmployees, filterSessions } from '../src/lib/filters';
import { allocatedCount, sessionStatus, teamStats } from '../src/lib/rules';

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, extra = '') {
  if (cond) passed++;
  else failures.push(`FAIL: ${name} ${extra}`);
}
function must(r: Result): AppState {
  if (!r.ok) throw new Error(`Expected ok, got error: ${r.error}`);
  return r.state;
}

const mgr = (managerId: string, teamId: string): ManagerActor => ({ role: 'manager', managerId, teamId, name: managerId });
const priya = mgr('M001', 'T-CS');
const meilin = mgr('M003', 'T-PK');
const tom = mgr('M004', 'T-PA');
const admin: Actor = { role: 'admin', name: 'Jordan Ellis' };

/* --- seed data meets the brief ------------------------------------------------ */
let s = createInitialState();
check('>= 24 employees', s.employees.length >= 24, String(s.employees.length));
check('8 sessions', sessions.length >= 8);
check('4 teams of managers', new Set(s.employees.map((e) => e.managerId)).size === 4);
check('S03 seeded at 4/5', allocatedCount(s, 'S03') === 4);
check('S03 is Nearly Full', sessionStatus(4, 5) === 'Nearly Full');
check('79% is Available', sessionStatus(79, 100) === 'Available');
check('80% is Nearly Full', sessionStatus(80, 100) === 'Nearly Full');
check('100% is Full', sessionStatus(5, 5) === 'Full');

/* --- manager permissions ---------------------------------------------------- */
let r = A.moveEmployee(s, priya, 'E2001', 'S02'); // another team's employee
check("manager cannot move another team's employee", !r.ok);
r = A.moveEmployee(s, priya, 'E1001', 'S07'); // S07 not approved for Customer Service
check('manager cannot use a session not approved for team', !r.ok);
s = must(A.moveEmployee(s, priya, 'E1001', 'S05'));
check('allocation works', s.allocations.E1001 === 'S05');
check('team becomes Draft with unsaved changes', s.submissions['T-CS'].status === 'Draft' && s.submissions['T-CS'].dirty);

/* --- move between sessions, and back to unallocated ------------------------------ */
s = must(A.moveEmployee(s, priya, 'E1001', 'S04'));
check('move between sessions', s.allocations.E1001 === 'S04');
s = must(A.moveEmployee(s, priya, 'E1001', null));
check('return to unallocated', !('E1001' in s.allocations));

/* --- capacity ---------------------------------------------------------------- */
let c = createInitialState();
c = must(A.moveEmployee(c, meilin, 'E3001', 'S03')); // 5/5
check('S03 now full', allocatedCount(c, 'S03') === 5 && sessionStatus(5, 5) === 'Full');
const full = A.moveEmployee(c, meilin, 'E3002', 'S03');
check('cannot exceed capacity', !full.ok);
check('full message is clear', !full.ok && /is full/.test(full.error), !full.ok ? full.error : '');
check('capacity count unchanged after refusal', allocatedCount(c, 'S03') === 5);
const adminFull = A.moveEmployee(c, admin, 'E3002', 'S03');
check('admin also cannot exceed capacity', !adminFull.ok);

/* --- undo -------------------------------------------------------------------- */
let u = createInitialState();
u = must(A.moveEmployee(u, priya, 'E1002', 'S01'));
u = must(A.undoLast(u, priya));
check('undo restores unallocated', !('E1002' in u.allocations) && u.undo.length === 0);
check('nothing to undo is an error', !A.undoLast(u, priya).ok);

/* --- save draft ---------------------------------------------------------------- */
let d = createInitialState();
d = must(A.moveEmployee(d, priya, 'E1003', 'S02'));
d = must(A.saveDraft(d, priya));
check('save draft clears dirty flag', !d.submissions['T-CS'].dirty && !!d.submissions['T-CS'].draftSavedAt);

/* --- submit workflow ----------------------------------------------------------- */
check('cannot submit without acknowledging unallocated', !A.submitTeam(d, priya, false).ok);
d = must(A.submitTeam(d, priya, true));
check('team Confirmed with timestamp', d.submissions['T-CS'].status === 'Confirmed' && !!d.submissions['T-CS'].submittedAt);
check('confirmed board is read-only for the manager', !A.moveEmployee(d, priya, 'E1003', null).ok);
check('manager cannot unlock directly', !A.reopenSubmission(d, priya, 'T-CS').ok);
check('manager cannot save draft when confirmed', !A.saveDraft(d, priya).ok);
check('reopen request needs a reason', !A.requestReopen(d, priya, '  ').ok);
d = must(A.requestReopen(d, priya, 'Two people joined the team'));
check('reopen request recorded', !!d.submissions['T-CS'].reopenRequestedAt);
check('cannot request reopen twice', !A.requestReopen(d, priya, 'again').ok);
check('admin correction allowed on confirmed team', A.moveEmployee(d, admin, 'E1003', 'S04').ok);
d = must(A.reopenSubmission(d, admin, 'T-CS'));
check('admin reopen sets Draft and clears request', d.submissions['T-CS'].status === 'Draft' && !d.submissions['T-CS'].reopenRequestedAt);
check('manager can edit again after reopen', A.moveEmployee(d, priya, 'E1003', 'S02').ok);

/* --- Planning team seeded as confirmed ------------------------------------------- */
const seed = createInitialState();
check('seeded confirmed team is read-only', !A.moveEmployee(seed, tom, 'E4007', null).ok);
check('team stats', teamStats(seed, 'T-PA').allocated === 7 && teamStats(seed, 'T-PA').unallocated === 0);
check('all-allocated team can submit without ack', A.submitTeam({ ...seed, submissions: { ...seed.submissions, 'T-PA': { ...seed.submissions['T-PA'], status: 'Draft' } } }, tom, false).ok);

/* --- requests -------------------------------------------------------------------- */
let q = createInitialState();
const before = q.employees.length;
check('request needs name and reason', !A.addRequest(q, priya, { name: '', employeeId: '', email: '', comments: '' }).ok);
check('bad email rejected', !A.addRequest(q, priya, { name: 'X Y', employeeId: '', email: 'nope', comments: 'why' }).ok);
q = must(A.addRequest(q, priya, { name: 'Ursula Vance', employeeId: '', email: 'ursula.vance@riverbend.example', comments: 'New starter' }));
check('request added to queue as Submitted', q.requests[0].status === 'Submitted' && q.requests[0].name === 'Ursula Vance');
check('request does NOT add employee', q.employees.length === before);
check('manager cannot update request status', !A.updateRequest(q, priya, q.requests[0].id, 'Added', '').ok);
check('declining needs a note', !A.updateRequest(q, admin, q.requests[0].id, 'Declined', '').ok);
const rid = q.requests[0].id;
q = must(A.updateRequest(q, admin, rid, 'Under review', ''));
q = must(A.updateRequest(q, admin, rid, 'Added', 'Confirmed with HR'));
check('Added creates employee in manager’s team', q.employees.length === before + 1 && q.employees[q.employees.length - 1].managerId === 'M001');
check('new employee is unallocated', !(q.employees[q.employees.length - 1].id in q.allocations));
check('Added request is locked', !A.updateRequest(q, admin, rid, 'Declined', 'oops').ok);
const dup = A.updateRequest(createInitialState(), admin, 'R-002', 'Added', ''); // E1099 is free
check('Added with free employee ID works', dup.ok);
let clash = createInitialState();
clash = { ...clash, requests: clash.requests.map((x) => (x.id === 'R-002' ? { ...x, employeeId: 'E1001' } : x)) };
check('duplicate employee ID is rejected', !A.updateRequest(clash, admin, 'R-002', 'Added', '').ok);

/* --- non-manager roles can't use manager actions ------------------------------------ */
check('admin cannot save a manager draft', !A.saveDraft(createInitialState(), admin).ok);
check('admin cannot submit as manager', !A.submitTeam(createInitialState(), admin, true).ok);

/* --- filters ----------------------------------------------------------------------- */
const fs = createInitialState();
check('unallocated filter', filterEmployees(fs, { ...emptyFilters, allocationStatus: 'Unallocated' }).length === fs.employees.length - 11);
check('session filter', filterEmployees(fs, { ...emptyFilters, sessionId: 'S03' }).length === 4);
check('manager filter', filterEmployees(fs, { ...emptyFilters, managerId: 'M002' }).length === 6);
check('submission status filter', filterEmployees(fs, { ...emptyFilters, submissionStatus: 'Confirmed' }).length === 7);
check('search by name', filterEmployees(fs, { ...emptyFilters, search: 'aisha' }).length === 1);
check('search by id', filterEmployees(fs, { ...emptyFilters, search: 'e4003' }).length === 1);
check('date filter (3 Dec)', filterEmployees(fs, { ...emptyFilters, date: '2026-12-03' }).length === 5);
check('session filter by team eligibility', filterSessions(fs, { ...emptyFilters, teamId: 'T-PA' }).every((x) => x.eligibleTeamIds.includes('T-PA')));
check('completion rows', completionRows(fs, emptyFilters).length === 4);
check('completion status filter', completionRows(fs, { ...emptyFilters, submissionStatus: 'Draft' }).length === 1);

/* --- CSV -------------------------------------------------------------------------- */
check('csv quotes commas', csvCell('a,b') === '"a,b"');
check('csv escapes quotes', csvCell('say "hi"') === '"say ""hi"""');
check('csv neutralises formulas', csvCell('=1+1') === "'=1+1" && csvCell('@x') === "'@x");
check('csv rows', toCsv(['a', 'b'], [[1, 'x']]) === 'a,b\r\n1,x');
const ex = exportToCsv('attendance', fs, { ...emptyFilters, sessionId: 'S03' });
check('attendance export has 4 attendees + header', ex.csv.split('\r\n').length === 5, String(ex.csv.split('\r\n').length));
check('unallocated export only has unallocated', exportToCsv('unallocated', fs, emptyFilters).csv.split('\r\n').length === fs.employees.length - 11 + 1);
check('export filename', /^trace-r8-requests-\d{8}\.csv$/.test(exportToCsv('requests', fs, emptyFilters).filename));
check('export respects filter', exportToCsv('requests', fs, { ...emptyFilters, managerId: 'M001' }).csv.split('\r\n').length === 2);

console.log(`${passed} checks passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.join('\n'));
  throw new Error('Verification failed');
}
