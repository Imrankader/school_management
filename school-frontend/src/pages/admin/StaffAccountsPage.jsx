import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { CLASS_CONFIG, toDisplayClassName } from '../../utils/academicClassOrder';
import { ShieldCheck, Search, Mail, KeyRound, GraduationCap, UserPlus } from 'lucide-react';

const EMPTY_ADD_FORM = { name: '', email: '', password: '', role: 'TEACHER', assignedClass: '', assignedSection: '' };

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

  const { addToast } = useToast();

  useEffect(() => {
    loadStaff();
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
      });
      addToast(`${addForm.role === 'ADMIN' ? 'Administrator' : 'Teacher'} account created for ${addForm.name.trim()}.`, 'success');
      setAddModalOpen(false);
      loadStaff();
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
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setResetModalUser(s); setResetPasswordValue(''); }}
                    >
                      <KeyRound size={13} /> Reset Password
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};
