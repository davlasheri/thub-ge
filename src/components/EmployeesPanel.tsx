import { useEffect, useState } from 'react';
import {
  Session, EmployeeRecord,
  listEmployees, createEmployee, updateEmployee,
} from '../utils/staffApi';
import '../pages/Staff.css';

// ── Employees ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<'admin' | 'staff', string> = {
  admin: 'ადმინისტრატორი', staff: 'თანამშრომელი',
};

export default function EmployeesPanel({ session }: { session: Session }) {
  const [employees, setEmployees] = useState<EmployeeRecord[] | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  // new employee form
  const [nUser, setNUser] = useState('');
  const [nName, setNName] = useState('');
  const [nPass, setNPass] = useState('');
  const [nRole, setNRole] = useState<'admin' | 'staff'>('staff');
  const [busy, setBusy] = useState(false);

  const reload = () =>
    listEmployees(session).then(setEmployees).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));

  useEffect(() => { reload(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m: string) => { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 3500); };
  const oops = (ex: unknown) => { setErr(ex instanceof Error ? ex.message : 'შეცდომა'); setMsg(''); };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await createEmployee(session, { username: nUser, password: nPass, displayName: nName, role: nRole });
      setNUser(''); setNName(''); setNPass(''); setNRole('staff');
      flash('თანამშრომელი დაემატა ✓');
      await reload();
    } catch (ex) { oops(ex); } finally { setBusy(false); }
  };

  const patch = async (payload: Parameters<typeof updateEmployee>[1], okMsg: string) => {
    try {
      await updateEmployee(session, payload);
      flash(okMsg);
      await reload();
    } catch (ex) { oops(ex); }
  };

  const resetPassword = (emp: EmployeeRecord) => {
    const pw = window.prompt(`ახალი პაროლი — ${emp.username} (მინ. 6 სიმბოლო):`);
    if (pw === null) return;
    patch({ id: emp.id, newPassword: pw }, 'პაროლი შეიცვალა ✓');
  };

  const rename = (emp: EmployeeRecord) => {
    const name = window.prompt(`სახელი — ${emp.username}:`, emp.displayName);
    if (name === null) return;
    patch({ id: emp.id, displayName: name }, 'შენახულია ✓');
  };

  if (err && !employees) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!employees) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  const isSelf = (e: EmployeeRecord) =>
    e.id === session.employee.id || e.username === session.employee.username;

  return (
    <div className="staff-content">
      <h2 className="staff-section-title">თანამშრომლები და როლები</h2>
      <p className="emp-roles-hint">
        <strong>ადმინისტრატორი</strong> — POS, ისტორია, სტატისტიკა, თანამშრომლების მართვა ·{' '}
        <strong>თანამშრომელი</strong> — მხოლოდ POS და ისტორია
      </p>

      {msg && <div className="pos-done">{msg}</div>}
      {err && <div className="staff-login-err emp-err">{err}</div>}

      <div className="emp-table">
        <div className="emp-row emp-row-head">
          <span>მომხმარებელი</span><span>სახელი</span><span>როლი</span><span>სტატუსი</span><span></span>
        </div>
        {employees.map(emp => (
          <div key={emp.id} className={`emp-row ${!emp.active ? 'emp-row-inactive' : ''}`}>
            <span className="emp-username">{emp.username}{isSelf(emp) && <small> (თქვენ)</small>}</span>
            <button className="emp-name-btn" onClick={() => rename(emp)} title="სახელის შეცვლა">{emp.displayName} ✎</button>
            <select
              className="emp-role-select"
              value={emp.role}
              disabled={isSelf(emp)}
              onChange={e => patch({ id: emp.id, role: e.target.value as 'admin' | 'staff' }, 'როლი შეიცვალა ✓')}
            >
              <option value="staff">{ROLE_LABELS.staff}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </select>
            <button
              className={`emp-status-btn ${emp.active ? 'emp-status-on' : 'emp-status-off'}`}
              disabled={isSelf(emp)}
              onClick={() => patch({ id: emp.id, active: !emp.active }, emp.active ? 'ანგარიში გაითიშა' : 'ანგარიში ჩაირთო ✓')}
            >
              {emp.active ? 'აქტიური' : 'გათიშული'}
            </button>
            <button className="staff-btn-secondary emp-pw-btn" onClick={() => resetPassword(emp)}>პაროლი</button>
          </div>
        ))}
      </div>

      <h3 className="staff-section-title emp-add-title">ახალი თანამშრომელი</h3>
      <form className="emp-add-form" onSubmit={addEmployee}>
        <input className="staff-input" placeholder="მომხმარებელი (ლათინურად)" value={nUser} onChange={e => setNUser(e.target.value)} />
        <input className="staff-input" placeholder="სახელი გვარი" value={nName} onChange={e => setNName(e.target.value)} />
        <input className="staff-input" type="password" placeholder="პაროლი (მინ. 6)" value={nPass} onChange={e => setNPass(e.target.value)} autoComplete="new-password" />
        <select className="emp-role-select" value={nRole} onChange={e => setNRole(e.target.value as 'admin' | 'staff')}>
          <option value="staff">{ROLE_LABELS.staff}</option>
          <option value="admin">{ROLE_LABELS.admin}</option>
        </select>
        <button className="staff-btn-primary emp-add-btn" disabled={busy}>{busy ? 'ინახება…' : '+ დამატება'}</button>
      </form>
    </div>
  );
}
