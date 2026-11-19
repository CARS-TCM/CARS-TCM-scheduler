import { useState, type FormEvent } from 'react';
import { managerById, teamById } from '../lib/rules';
import { validateRequestForm, type RequestForm } from '../lib/actions';
import { formatDate, formatTime } from '../lib/dates';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useStore } from '../store/AppStore';

export function RequestFormModal({ onClose }: { onClose: () => void }) {
  const { actor, addRequest } = useStore();
  const [form, setForm] = useState<RequestForm>({ name: '', employeeId: '', email: '', comments: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof RequestForm, string>>>({});
  if (actor.role !== 'manager') return null;

  const team = teamById(actor.teamId);
  const manager = managerById(actor.managerId);
  const set = (k: keyof RequestForm) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateRequestForm(form);
    setErrors(errs);
    const firstKey = (Object.keys(errs) as (keyof RequestForm)[])[0];
    if (firstKey) {
      document.getElementById(`req-${firstKey}`)?.focus();
      return;
    }
    if (addRequest(form).ok) onClose();
  };

  const field = (k: keyof RequestForm) => ({
    id: `req-${k}`,
    'aria-invalid': errors[k] ? (true as const) : undefined,
    'aria-describedby': errors[k] ? `req-${k}-err` : undefined,
  });
  const err = (k: keyof RequestForm) =>
    errors[k] ? (
      <p id={`req-${k}-err`} className="mt-1 text-sm font-medium text-bad-fg">
        ✕ {errors[k]}
      </p>
    ) : null;

  return (
    <Modal
      title="Request team member to be added"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="request-form" className="btn-primary">
            Submit request
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink2">
        Use this if someone who should attend training is missing from your list. The administrator will review it. The
        person will <strong>not</strong> appear on your board until the request is approved.
      </p>
      <form id="request-form" onSubmit={onSubmit} noValidate className="space-y-3">
        <div>
          <label htmlFor="req-name" className="label">
            Employee name <span className="text-bad-fg">(required)</span>
          </label>
          <input {...field('name')} className="input" value={form.name} onChange={set('name')} autoComplete="off" data-autofocus />
          {err('name')}
        </div>
        <div>
          <label htmlFor="req-employeeId" className="label">
            Employee ID <span className="font-normal text-muted">(if known)</span>
          </label>
          <input {...field('employeeId')} className="input" value={form.employeeId} onChange={set('employeeId')} autoComplete="off" />
          {err('employeeId')}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="req-team" className="label">
              Team
            </label>
            <input id="req-team" className="input" value={team?.name ?? ''} readOnly />
          </div>
          <div>
            <label htmlFor="req-manager" className="label">
              Manager
            </label>
            <input id="req-manager" className="input" value={manager ? `${manager.name} (${manager.id})` : ''} readOnly />
          </div>
        </div>
        <div>
          <label htmlFor="req-email" className="label">
            Work email <span className="font-normal text-muted">(if known)</span>
          </label>
          <input {...field('email')} type="email" className="input" value={form.email} onChange={set('email')} autoComplete="off" />
          {err('email')}
        </div>
        <div>
          <label htmlFor="req-comments" className="label">
            Reason or comments <span className="text-bad-fg">(required)</span>
          </label>
          <textarea {...field('comments')} rows={3} className="input" value={form.comments} onChange={set('comments')} />
          {err('comments')}
        </div>
      </form>
    </Modal>
  );
}

export function MyRequests({ onNew }: { onNew: () => void }) {
  const { state, actor } = useStore();
  if (actor.role !== 'manager') return null;
  const mine = state.requests.filter((r) => r.managerId === actor.managerId);

  if (mine.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="font-medium">You haven’t requested any missing team members.</p>
        <p className="mt-1 text-sm text-muted">If someone is missing from your list, send a request and the administrator will review it.</p>
        <button type="button" className="btn-primary mt-3" onClick={onNew}>
          Request team member to be added
        </button>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse">
        <caption className="sr-only">Your team member requests and their status</caption>
        <thead>
          <tr>
            {['Request', 'Employee', 'Submitted', 'Status', 'Administrator note'].map((h) => (
              <th key={h} scope="col" className="th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mine.map((r) => (
            <tr key={r.id}>
              <td className="td font-medium">{r.id}</td>
              <td className="td">
                {r.name}
                {r.employeeId && <span className="block text-xs text-muted">ID {r.employeeId}</span>}
              </td>
              <td className="td">
                {formatDate(r.createdAt)} {formatTime(r.createdAt)}
              </td>
              <td className="td">
                <StatusBadge status={r.status} />
              </td>
              <td className="td">{r.adminNote || <span className="text-muted">–</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
