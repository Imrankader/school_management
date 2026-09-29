import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { academicService } from '../../services/academicService';
import { homeworkService } from '../../services/homeworkService';
import { holidayService } from '../../services/holidayService';
import { leaveService } from '../../services/leaveService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Award,
  BookOpen,
  Calendar,
  Sun,
  FileText,
  Plus,
  Trash2,
  Bell,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { CLASS_CONFIG, toDisplayClassName } from '../../utils/academicClassOrder';

export const TeacherDashboard = () => {
  // Tabs: 'homework' | 'leave' | 'holidays' | 'notifications'
  const [activeTab, setActiveTab] = useState('homework');
  const [loading, setLoading] = useState(true);

  // Homework State
  const [homeworkList, setHomeworkList] = useState([]);
  const [hwModal, setHwModal] = useState(false);
  const [hwForm, setHwForm] = useState({
    title: '',
    description: '',
    className: 'Class 10',
    section: 'A',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  });

  // Holidays State
  const [holidays, setHolidays] = useState([]);

  // Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [hwRes, holRes, lvRes] = await Promise.allSettled([
        homeworkService.getAll(),
        holidayService.getAll(),
        leaveService.getAll(),
      ]);

      if (hwRes.status === 'fulfilled' && hwRes.value?.data) setHomeworkList(hwRes.value.data);
      if (holRes.status === 'fulfilled' && holRes.value?.data) setHolidays(holRes.value.data);
      if (lvRes.status === 'fulfilled' && lvRes.value?.data) setLeaveRequests(lvRes.value.data);
    } catch (err) {
      addToast('Failed to load teacher portal data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Homework handlers
  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      await homeworkService.create(hwForm);
      addToast('Homework assigned successfully!', 'success');
      setHwModal(false);
      setHwForm({
        title: '',
        description: '',
        className: 'Class 10',
        section: 'A',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      });
      const res = await homeworkService.getAll();
      if (res.success && res.data) setHomeworkList(res.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to assign homework', 'error');
    }
  };

  const handleDeleteHomework = async (id) => {
    if (!window.confirm('Delete this homework?')) return;
    try {
      await homeworkService.delete(id);
      addToast('Homework deleted', 'success');
      const res = await homeworkService.getAll();
      if (res.success && res.data) setHomeworkList(res.data);
    } catch (err) {
      addToast('Failed to delete homework', 'error');
    }
  };

  // Leave approval handlers
  const handleApproveLeave = async (id) => {
    try {
      await leaveService.approve(id, 'Approved by Teacher');
      addToast('Leave request approved', 'success');
      const res = await leaveService.getAll();
      if (res.success && res.data) setLeaveRequests(res.data);
    } catch (err) {
      addToast('Failed to approve leave', 'error');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await leaveService.reject(id, 'Rejected by Teacher');
      addToast('Leave request rejected', 'warning');
      const res = await leaveService.getAll();
      if (res.success && res.data) setLeaveRequests(res.data);
    } catch (err) {
      addToast('Failed to reject leave', 'error');
    }
  };

  // Notification handler
  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await notificationService.getMyNotifications();
      if (res.success && res.data) setNotifications(res.data);
    } catch (err) {
      addToast('Failed to load notifications', 'error');
    } finally {
      setLoadingNotifications(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Teacher Dashboard' }]} />

      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Teacher Command Center</h1>
          <p className="page-subtitle">
            Manage homework assignments, review student leave requests, check official holidays, and view announcements.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Link
            to="/teacher/marks"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Award size={15} />
            <span>Open Gradebook / Marks</span>
            <ExternalLink size={13} style={{ opacity: 0.8 }} />
          </Link>
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            title="Refresh dashboard data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('homework')}
          className={`btn btn-sm ${activeTab === 'homework' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BookOpen size={16} /> Homework ({homeworkList.length})
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`btn btn-sm ${activeTab === 'leave' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileText size={16} /> Leave Requests ({leaveRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`btn btn-sm ${activeTab === 'holidays' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sun size={16} /> Holidays Calendar ({holidays.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('notifications');
            if (notifications.length === 0) loadNotifications();
          }}
          className={`btn btn-sm ${activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Bell size={16} /> Announcements
        </button>
      </div>

      {/* Tab 1: Homework */}
      {activeTab === 'homework' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
              <BookOpen size={18} className="text-primary" /> Active Homework Assignments
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setHwModal(true)}>
              <Plus size={14} /> Assign Homework
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Class / Section</th>
                  <th>Description</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {homeworkList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      {loading ? 'Loading homework assignments...' : 'No homework assigned yet. Click "+ Assign Homework" to create one.'}
                    </td>
                  </tr>
                ) : (
                  homeworkList.map((hw) => (
                    <tr key={hw.id}>
                      <td style={{ fontWeight: 600 }}>{hw.title}</td>
                      <td>
                        <span className="badge badge-primary">
                          {toDisplayClassName(hw.className)} {hw.section ? `(${hw.section})` : ''}
                        </span>
                      </td>
                      <td style={{ maxWidth: '340px', fontSize: '0.875rem' }}>{hw.description}</td>
                      <td>
                        <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} /> {hw.dueDate}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHomework(hw.id)} title="Delete homework">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Leave Requests */}
      {activeTab === 'leave' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
              <FileText size={18} className="text-primary" /> Student Absence Records
            </h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Date Period</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Review Note</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      {loading ? 'Loading leave requests...' : 'No student leave records submitted.'}
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((r) => (
                    <tr key={r.id}>
                      <td><strong>Student #{r.studentId}</strong></td>
                      <td style={{ fontWeight: 600 }}>{r.startDate} to {r.endDate || r.startDate}</td>
                      <td style={{ maxWidth: '280px', fontSize: '0.875rem' }}>{r.reason}</td>
                      <td>
                        <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                          {r.status || 'RECORDED'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.reviewNote || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {r.status === 'PENDING' ? (
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button className="btn btn-sm btn-primary" onClick={() => handleApproveLeave(r.id)}>
                              Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleRejectLeave(r.id)}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Complete</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Holidays */}
      {activeTab === 'holidays' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
              <Sun size={18} className="text-warning" /> Official School Holidays & Events
            </h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Holiday Name</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      {loading ? 'Loading holidays...' : 'No holidays scheduled.'}
                    </td>
                  </tr>
                ) : (
                  holidays.map((h) => (
                    <tr key={h.id}>
                      <td><strong>{h.date}</strong></td>
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td><span className={`badge ${h.holidayType === 'PUBLIC' ? 'badge-primary' : 'badge-warning'}`}>{h.holidayType}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{h.description || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
              <Bell size={18} className="text-primary" /> School Broadcasts & Announcements
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={loadNotifications} disabled={loadingNotifications}>
              <RefreshCw size={13} className={loadingNotifications ? 'animate-spin' : ''} />
              <span>{loadingNotifications ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Audience</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {loadingNotifications ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      Loading announcements...
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      No announcements broadcasted.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id}>
                      <td><strong>{n.date}</strong></td>
                      <td>
                        <span className={`badge ${n.audience === 'BOTH' ? 'badge-success' : 'badge-warning'}`}>
                          {n.audience === 'TEACHERS' ? 'Teachers' : n.audience === 'BOTH' ? 'All Users' : n.audience}
                        </span>
                      </td>
                      <td style={{ maxWidth: '460px', fontSize: '0.875rem' }}>{n.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Homework Modal */}
      <Modal
        isOpen={hwModal}
        onClose={() => setHwModal(false)}
        title="Assign Homework"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setHwModal(false)}>Cancel</button>
            <button type="submit" form="teacherHwForm" className="btn btn-primary">Assign Homework</button>
          </>
        }
      >
        <form id="teacherHwForm" onSubmit={handleCreateHomework}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Homework Title *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Chapter 5 Practice Questions"
              value={hwForm.title}
              onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Class Name *</label>
              <select
                className="form-control"
                required
                value={hwForm.className}
                onChange={(e) => setHwForm({ ...hwForm, className: e.target.value })}
              >
                <option value="" disabled>Select Class</option>
                {CLASS_CONFIG.map((c) => (
                  <option key={c.internalValue} value={c.internalValue}>{c.displayLabel}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Section</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. A"
                value={hwForm.section}
                onChange={(e) => setHwForm({ ...hwForm, section: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Due Date *</label>
            <input
              type="date"
              className="form-control"
              required
              value={hwForm.dueDate}
              onChange={(e) => setHwForm({ ...hwForm, dueDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Instructions *</label>
            <textarea
              className="form-control"
              rows={3}
              required
              placeholder="Provide instructions for students..."
              value={hwForm.description}
              onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
