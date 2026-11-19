import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatTime, formatTimeRange, formatWeekday } from '../lib/dates';
import { allocatedCount, allocationLabel, capacityPercent, sessionStatus } from '../lib/rules';
import { useStore } from '../store/AppStore';
import type { Employee, TrainingSession } from '../types';

const UNALLOCATED = 'unallocated';

interface BoardProps {
  employees: Employee[];
  sessions: TrainingSession[];
  readOnly: boolean;
}

/** Pointer first (precise), rectangle overlap as the fallback for keyboard dragging. */
const collision: CollisionDetection = (args) => {
  const p = pointerWithin(args);
  return p.length ? p : rectIntersection(args);
};

export function Board({ employees, sessions, readOnly }: BoardProps) {
  const { state, moveEmployee } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const empName = (id: string | number) => employees.find((e) => e.id === String(id))?.name ?? 'Team member';
  const targetName = (id: string | number) =>
    String(id) === UNALLOCATED ? 'the unallocated list' : sessions.find((s) => s.id === String(id))?.name ?? 'a session';

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${empName(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${empName(active.id)} is over ${targetName(over.id)}.` : `${empName(active.id)} is not over a drop area.`,
    onDragEnd: ({ active, over }) =>
      over ? `${empName(active.id)} dropped on ${targetName(over.id)}.` : `${empName(active.id)} was dropped outside a drop area.`,
    onDragCancel: ({ active }) => `Moving ${empName(active.id)} was cancelled.`,
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (readOnly || !e.over) return;
    const target = String(e.over.id) === UNALLOCATED ? null : String(e.over.id);
    moveEmployee(String(e.active.id), target);
  };

  const active = activeId ? employees.find((e) => e.id === activeId) ?? null : null;
  const unallocated = employees.filter((e) => !state.allocations[e.id]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'To pick up a team member, press space or enter. Use the arrow keys to move, then press space or enter to drop, or escape to cancel. You can also use the Move to list on each card.',
        },
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_1fr]">
        <UnallocatedColumn employees={unallocated} sessions={sessions} readOnly={readOnly} total={employees.length} />

        <section aria-labelledby="sessions-h">
          <h2 id="sessions-h" className="mb-3 text-lg font-semibold">
            Approved training sessions for your team
          </h2>
          {sessions.length === 0 ? (
            <p className="card p-4 text-sm">No sessions have been approved for your team yet. Contact the TRACE training coordinator.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} employees={employees} sessions={sessions} activeEmployee={active} readOnly={readOnly} />
              ))}
            </div>
          )}
        </section>
      </div>

      <DragOverlay>
        {active ? (
          <div className="rounded-md border-2 border-accent bg-surface p-3 text-sm font-semibold shadow-xl">
            {active.name} <span className="font-normal text-muted">({active.id})</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ---------------------------------------------------------------- */

function UnallocatedColumn({
  employees,
  sessions,
  readOnly,
  total,
}: {
  employees: Employee[];
  sessions: TrainingSession[];
  readOnly: boolean;
  total: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: UNALLOCATED, disabled: readOnly });
  const [q, setQ] = useState('');
  const list = employees.filter(
    (e) => !q.trim() || e.name.toLowerCase().includes(q.trim().toLowerCase()) || e.id.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <section
      ref={setNodeRef}
      aria-labelledby="unalloc-h"
      className={`card p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto ${
        isOver ? 'ring-4 ring-accent' : ''
      }`}
    >
      <h2 id="unalloc-h" className="text-lg font-semibold">
        Unallocated team members <span className="font-normal text-muted">({employees.length} of {total})</span>
      </h2>
      <p className="mt-1 text-sm text-muted">
        {readOnly ? 'This board is read-only.' : 'Drag a card onto a session, or use “Move to” on the card.'}
      </p>
      {employees.length > 3 && (
        <div className="mt-3">
          <label htmlFor="find-unalloc" className="label">
            Find a team member
          </label>
          <input id="find-unalloc" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or employee ID" />
        </div>
      )}
      <ul className="mt-3 space-y-2">
        {list.map((e) => (
          <EmployeeCard key={e.id} employee={e} sessions={sessions} readOnly={readOnly} />
        ))}
      </ul>
      {employees.length === 0 && (
        <p className="mt-3 rounded-md border border-dashed border-ok-line bg-ok-bg p-3 text-sm text-ok-fg">
          ✓ Everyone in your team has a session. You can drag a card back here to unallocate someone.
        </p>
      )}
      {employees.length > 0 && list.length === 0 && (
        <p className="mt-3 text-sm text-muted">No unallocated team members match “{q}”.</p>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- */

function SessionCard({
  session,
  employees,
  sessions,
  activeEmployee,
  readOnly,
}: {
  session: TrainingSession;
  employees: Employee[];
  sessions: TrainingSession[];
  activeEmployee: Employee | null;
  readOnly: boolean;
}) {
  const { state } = useStore();
  const { setNodeRef, isOver } = useDroppable({ id: session.id, disabled: readOnly });
  const allocated = allocatedCount(state, session.id);
  const status = sessionStatus(allocated, session.capacity);
  const remaining = Math.max(0, session.capacity - allocated);
  const pct = capacityPercent(allocated, session.capacity);
  const mine = employees.filter((e) => state.allocations[e.id] === session.id);
  const others = allocated - mine.length;
  const blocked = status === 'Full' && !!activeEmployee && state.allocations[activeEmployee.id] !== session.id;
  const barColour = status === 'Full' ? 'bg-red-400' : status === 'Nearly Full' ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <article
      ref={setNodeRef}
      aria-label={`${session.name}, ${status}, ${remaining} places remaining`}
      className={`card p-4 ${isOver ? (blocked ? 'ring-4 ring-red-400' : 'ring-4 ring-accent') : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{session.name}</h3>
        <StatusBadge status={status} />
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Date</dt>
        <dd>
          {formatWeekday(session.startsAt)} {formatDate(session.startsAt)}
        </dd>
        <dt className="text-muted">Time</dt>
        <dd>{formatTimeRange(session.startsAt, session.endsAt)}</dd>
        <dt className="text-muted">Delivery</dt>
        <dd>{session.method}</dd>
        <dt className="text-muted">{session.method === 'Microsoft Teams' ? 'Teams' : 'Location'}</dt>
        <dd className="break-words">
          {session.method === 'Microsoft Teams' ? (
            <a href={session.location} target="_blank" rel="noreferrer" className="text-link underline">
              Microsoft Teams meeting link<span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            session.location
          )}
        </dd>
        <dt className="text-muted">Facilitator</dt>
        <dd>{session.facilitator}</dd>
      </dl>

      <div className="mt-3">
        <p className="text-sm">
          <strong>{allocated}</strong> of <strong>{session.capacity}</strong> places taken ·{' '}
          <strong>{remaining}</strong> remaining
        </p>
        <div
          role="progressbar"
          aria-label={`${session.name} capacity`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct}% full`}
          className="mt-1 h-2 overflow-hidden rounded bg-line"
        >
          <div className={`h-full ${barColour}`} style={{ width: `${pct}%` }} />
        </div>
        {others > 0 && (
          <p className="mt-1 text-xs text-muted">
            {mine.length} from your team · {others} from other teams
          </p>
        )}
      </div>

      <div
        className={`mt-3 min-h-[4.5rem] rounded-md border-2 border-dashed p-2 ${
          isOver ? (blocked ? 'border-bad-line bg-bad-bg' : 'border-info-line bg-info-bg') : 'border-line-strong'
        }`}
      >
        {isOver && blocked && (
          <p className="mb-2 text-sm font-semibold text-bad-fg">✕ This session is full. {activeEmployee?.name} can’t be dropped here.</p>
        )}
        {mine.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted">
            {status === 'Full' ? 'Session full – no places left.' : readOnly ? 'Nobody from your team.' : 'Drop a team member here'}
          </p>
        ) : (
          <ul className="space-y-2">
            {mine.map((e) => (
              <EmployeeCard key={e.id} employee={e} sessions={sessions} readOnly={readOnly} />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- */

function EmployeeCard({
  employee,
  sessions,
  readOnly,
}: {
  employee: Employee;
  sessions: TrainingSession[];
  readOnly: boolean;
}) {
  const { state, moveEmployee } = useStore();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: employee.id, disabled: readOnly });
  const current = state.allocations[employee.id] ?? '';
  const selectId = `move-${employee.id}`;

  return (
    <li
      ref={setNodeRef}
      className={`rounded-md border border-line-strong bg-surface p-3 shadow-sm ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start gap-2">
        {!readOnly && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${employee.name}`}
            style={{ touchAction: 'none' }}
            className="mt-0.5 cursor-grab rounded border border-line-strong px-1.5 py-1 text-ink2 hover:bg-surface-2 active:cursor-grabbing"
          >
            <span aria-hidden="true">⠿</span>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">{employee.name}</p>
          <p className="text-xs text-muted">Employee ID {employee.id}</p>
          <div className="mt-1">
            <StatusBadge status={allocationLabel(state, employee)} />
          </div>
          {employee.note && (
            <p className="mt-1 text-xs text-warn-fg">
              <span aria-hidden="true">▲ </span>
              <strong>Note:</strong> {employee.note}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2">
        <label htmlFor={selectId} className="text-xs font-medium text-ink2">
          Move {employee.name} to
        </label>
        <select
          id={selectId}
          className="input mt-1 py-1"
          disabled={readOnly}
          value={current}
          onChange={(e) => moveEmployee(employee.id, e.target.value || null)}
        >
          <option value="">Unallocated</option>
          {sessions.map((s) => {
            const n = allocatedCount(state, s.id);
            const full = n >= s.capacity && s.id !== current;
            return (
              <option key={s.id} value={s.id} disabled={full}>
                {s.name} – {formatDate(s.startsAt)} {formatTime(s.startsAt)} ({full ? 'full' : `${s.capacity - n} left`})
              </option>
            );
          })}
        </select>
      </div>
    </li>
  );
}
