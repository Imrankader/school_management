import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { CLASS_CONFIG, toDisplayClassName } from '../../utils/academicClassOrder';
import { ShieldCheck, Search, Mail, KeyRound, GraduationCap, UserPlus, Trash2, AlertCircle, History } from 'lucide-react';

const EMPTY_ADD_FORM = { name: '', email: '', password: '', role: 'TEACHER', assignedClass: '', assignedSection: '', dateOfBirth: '' };

export const StaffAccountsPage = () => {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetting, setResetting] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addingStaff, setAddingStaff] = useState(false);

  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [auditLog, setAuditLog] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadStaff();
    loadAuditLog();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await authService.getStaffAccounts();
      setStaff(res.success && res.data ? res.data : []);
    } catch (err) {
      addToast('Failed to load staff accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      const res = await authService.getAuditLog();
      setAuditLog(res.success && res.data ? res.data : []);
    } catch (err) {
      // Non-critical: the activity log is a convenience view, not core functionality.
      console.error('Failed to load activity log', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setDeleting(true);
    try {
      await authService.deleteStaff(deleteModalUser.id);
      addToast(`Deleted ${deleteModalUser.role === 'ADMIN' ? 'Administrator' : 'Teacher'} account: ${deleteModalUser.name}.`, 'success');
      setDeleteModalUser(null);
      loadStaff();
      loadAuditLog();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete staff account', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const describeAuditEntry = (entry) => {
    const targetLabel = entry.targetRole === 'ADMIN' ? 'Administrator' : entry.targetRole === 'TEACHER' ? 'Teacher' : entry.targetRole || 'account';
    switch (entry.action) {
      case 'CREATE_STAFF':
        return `created a ${targetLabel} account (${entry.targetEmail})`;
      case 'DELETE_STAFF':
        return `deleted a ${targetLabel} account (${entry.targetEmail})`;
      case 'RESET_PASSWORD':
        return `reset the password for ${entry.targetEmail}`;
      default:
        return `${entry.action} — ${entry.targetEmail || ''}`;
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalUser) return;
    if (!resetPasswordValue || resetPasswordValue.trim().length < 4) {
      addToast('Password must be at least 4 characters.', 'warning');
      return;
    }
    setResetting(true);
    try {
      await authService.resetUserPassword(resetModalUser.id, resetPasswordValue.trim());
      addToast(`Password updated for ${resetModalUser.name}.`, 'success');
      setResetModalUser(null);
      setResetPasswordValue('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleOpenAdd = () => {
    setAddForm(EMPTY_ADD_FORM);
    setAddModalOpen(true);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      addToast('Name and email are required.', 'warning');
      return;
    }
    if (!addForm.password || addForm.password.trim().length < 4) {
      addToast('Password must be at least 4 characters.', 'warning');
      return;
    }
    setAddingStaff(true);
    try {
      await authService.createStaff({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password.trim(),
        role: addForm.role,
        assignedClass: addForm.role === 'TEACHER' ? (addForm.assignedClass || null) : null,
        assignedSection: addForm.role === 'TEACHER' ? (addForm.assignedSection.trim() || null) : null,
        dateOfBirth: addForm.dateOfBirth || null,
      });
      addToast(`${addForm.role === 'ADMIN' ? 'Administrator' : 'Teacher'} account created for ${addForm.name.trim()}.`, 'success');
      setAddModalOpen(false);
      loadStaff();
      loadAuditLog();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create staff account', 'error');
    } finally {
      setAddingStaff(false);
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  const admins = filteredStaff.filter((s) => s.role === 'ADMIN');
  const teachers = filteredStaff.filter((s) => s.role === 'TEACHER');

  return (
    <div>
      <Breadcrumb items={[{ label: 'Staff Accounts' }]} />
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Staff Accounts</h1>
          <p className="page-subtitle">
            Every Admin and Teacher login. Add new staff or reset a forgotten password here.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-secondary">{staff.length} Accounts</span>
          <button type="button" className="btn btn-secondary" onClick={() => setShowActivityLog((v) => !v)}>
            <History size={16} /> {showActivityLog ? 'Hide' : 'Show'} Activity Log
          </button>
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <Search size={15} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, border: 'none', padding: '0.25rem 0', boxShadow: 'none' }}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Assigned Class</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  {loading ? 'Loading staff accounts...' : 'No staff accounts found.'}
                </td>
              </tr>
            ) : (
              [...admins, ...teachers].map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <Mail size={14} /> {s.email}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${s.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {s.role === 'ADMIN' ? <ShieldCheck size={11} /> : <GraduationCap size={11} />}
                      {s.role === 'ADMIN' ? 'Administrator' : 'Teacher'}
                    </span>
                  </td>
                  <td>
                    {s.assignedClass ? (
                      <span className="badge badge-secondary">
                        {toDisplayClassName(s.assignedClass)}{s.assignedSection ? ` (${s.assignedSection})` : ''}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setResetModalUser(s); setResetPasswordValue(''); }}
                      >
                        <KeyRound size={13} /> Reset Password
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#ef4444' }}
                        onClick={() => setDeleteModalUser(s)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showActivityLog && (
        <div className="card" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={16} /> Recent Activity
          </h3>
          {auditLog.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No account-management actions recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
              {auditLog.map((entry) => (
                <div key={entry.id} style={{ fontSize: '0.825rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <strong>{entry.actorEmail}</strong> {describeAuditEntry(entry)}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
        title={`Reset Password — ${resetModalUser?.name || ''}`}
        icon={KeyRound}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setResetModalUser(null)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleResetPassword} disabled={resetting}>
              {resetting ? 'Saving...' : 'Save New Password'}
            </button>
          </>
        }
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">New Password</label>
          <input
            type="text"
            className="form-input"
            placeholder="At least 4 characters"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Staff Account"
        icon={UserPlus}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAddModalOpen(false)}>Cancel</button>
            <button type="submit" form="addStaffForm" className="btn btn-primary" disabled={addingStaff}>
              {addingStaff ? 'Creating...' : 'Create Account'}
            </button>
          </>
        }
      >
        <form id="addStaffForm" onSubmit={handleAddStaff}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Fathima Begum"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              required
              placeholder="e.g. teacher@school.com"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="At least 4 characters"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth (optional)</label>
            <input
              type="date"
              className="form-input"
              value={addForm.dateOfBirth}
              onChange={(e) => setAddForm({ ...addForm, dateOfBirth: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
            >
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {addForm.role === 'TEACHER' && (
            <>
              <div className="form-group">
                <label className="form-label">Assigned Class (optional)</label>
                <select
                  className="form-select"
                  value={addForm.assignedClass}
                  onChange={(e) => setAddForm({ ...addForm, assignedClass: e.target.value })}
                >
                  <option value="">-- Not assigned yet --</option>
                  {CLASS_CONFIG.map((c) => (
                    <option key={c.internalValue} value={c.internalValue}>{c.displayLabel}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Section (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. A, or Lily"
                  value={addForm.assignedSection}
                  onChange={(e) => setAddForm({ ...addForm, assignedSection: e.target.value })}
                />
              </div>
            </>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        title="Delete Staff Account"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '50%', color: '#ef4444' }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Are you sure you want to delete this {deleteModalUser?.role === 'ADMIN' ? 'administrator' : 'teacher'} account?
              </p>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>{deleteModalUser?.name}</strong> ({deleteModalUser?.email}) will lose access immediately. This cannot be undone.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" disabled={deleting} onClick={() => setDeleteModalUser(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              <Trash2 size={15} />
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
