import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ADMIN, createInitialState, managers } from '../data/sampleData';
import * as A from '../lib/actions';
import { allocatedCount, sessionById, sessionStatus } from '../lib/rules';
import type { Actor, AppState, RequestStatus, Result, Role } from '../types';

const STATE_KEY = 'trace-r8-scheduler:state:v1';
const LOGIN_KEY = 'trace-r8-scheduler:login:v1';

export type ToastKind = 'success' | 'warning' | 'error' | 'info';
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}
export interface Login {
  role: Role;
  /** Kept even when signed in as admin so switching back returns to the same manager. */
  managerId: string;
}

interface Store {
  state: AppState;
  login: Login;
  setLogin: (l: Login) => void;
  actor: Actor;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  notify: (kind: ToastKind, message: string) => void;
  moveEmployee: (employeeId: string, sessionId: string | null) => Result;
  undo: () => Result;
  saveDraft: () => Result;
  submit: (acknowledgedUnallocated: boolean) => Result;
  requestReopen: (reason: string) => Result;
  addRequest: (form: A.RequestForm) => Result;
  adminReopen: (teamId: string) => Result;
  updateRequest: (id: string, status: RequestStatus, note: string) => Result;
  resetData: () => void;
}

const Ctx = createContext<Store | null>(null);

function isValidState(p: unknown): p is AppState {
  const s = p as AppState;
  return (
    !!s &&
    Array.isArray(s.employees) &&
    typeof s.allocations === 'object' &&
    s.allocations !== null &&
    typeof s.submissions === 'object' &&
    s.submissions !== null &&
    Array.isArray(s.requests) &&
    Array.isArray(s.audit) &&
    Array.isArray(s.undo)
  );
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidState(parsed)) return parsed;
    }
  } catch {
    /* corrupt or blocked storage: fall back to sample data */
  }
  return createInitialState();
}

function loadLogin(): Login {
  try {
    const raw = localStorage.getItem(LOGIN_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Login;
      if ((p.role === 'manager' || p.role === 'admin') && managers.some((m) => m.id === p.managerId)) return p;
    }
  } catch {
    /* ignore */
  }
  return { role: 'manager', managerId: managers[0].id };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const stateRef = useRef(state);
  const [login, setLoginState] = useState<Login>(loadLogin);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((kind: ToastKind, message: string) => {
    if (!message) return;
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 10000 : 7000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Keep draft changes across refreshes.
  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked */
    }
  }, [state]);

  // Pick up changes made in another browser tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STATE_KEY || !e.newValue) return;
      try {
        const p: unknown = JSON.parse(e.newValue);
        if (isValidState(p)) {
          stateRef.current = p;
          setState(p);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLogin = useCallback((l: Login) => {
    setLoginState(l);
    try {
      localStorage.setItem(LOGIN_KEY, JSON.stringify(l));
    } catch {
      /* ignore */
    }
  }, []);

  const actor = useMemo<Actor>(() => {
    if (login.role === 'admin') return { role: 'admin', name: ADMIN.name };
    const m = managers.find((x) => x.id === login.managerId) ?? managers[0];
    return { role: 'manager', managerId: m.id, teamId: m.teamId, name: m.name };
  }, [login]);

  const run = useCallback(
    (fn: (s: AppState) => Result, kind: ToastKind = 'success'): Result => {
      const res = fn(stateRef.current);
      if (res.ok) {
        if (res.state !== stateRef.current) {
          stateRef.current = res.state;
          setState(res.state);
        }
        notify(kind, res.message);
      } else {
        notify('error', res.error);
      }
      return res;
    },
    [notify],
  );

  const moveEmployee = useCallback(
    (employeeId: string, sessionId: string | null): Result => {
      const before = stateRef.current;
      const res = run((s) => A.moveEmployee(s, actor, employeeId, sessionId));
      if (res.ok && sessionId) {
        const sess = sessionById(sessionId);
        if (sess) {
          const prev = sessionStatus(allocatedCount(before, sessionId), sess.capacity);
          const n = allocatedCount(res.state, sessionId);
          const now = sessionStatus(n, sess.capacity);
          if (now !== prev && now !== 'Available') {
            const left = sess.capacity - n;
            notify(
              'warning',
              now === 'Full'
                ? `${sess.name} is now full.`
                : `${sess.name} is nearly full – ${left} place${left === 1 ? '' : 's'} left.`,
            );
          }
        }
      }
      return res;
    },
    [actor, run, notify],
  );

  const value: Store = {
    state,
    login,
    setLogin,
    actor,
    toasts,
    dismissToast,
    notify,
    moveEmployee,
    undo: () => run((s) => A.undoLast(s, actor), 'info'),
    saveDraft: () => run((s) => A.saveDraft(s, actor)),
    submit: (ack) => run((s) => A.submitTeam(s, actor, ack)),
    requestReopen: (reason) => run((s) => A.requestReopen(s, actor, reason)),
    addRequest: (form) => run((s) => A.addRequest(s, actor, form)),
    adminReopen: (teamId) => run((s) => A.reopenSubmission(s, actor, teamId)),
    updateRequest: (id, status, note) => run((s) => A.updateRequest(s, actor, id, status, note)),
    resetData: () => {
      const fresh = createInitialState();
      stateRef.current = fresh;
      setState(fresh);
      notify('info', 'Sample data has been reset to its starting position.');
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}
