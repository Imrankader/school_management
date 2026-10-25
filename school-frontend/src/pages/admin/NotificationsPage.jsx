import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../context/ToastContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Bell, Send, Calendar, Users, CheckCircle2, RefreshCw, Plus, Edit2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const NotificationsPage = () => {
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetStudents, setTargetStudents] = useState(true);
  const [targetTeachers, setTargetTeachers] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit state
  const [editingNotification, setEditingNotification] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      addToast('Please enter a notification message', 'warning');
      return;
    }
    if (!targetStudents && !targetTeachers) {
      addToast('Select at least one target audience', 'warning');
      return;
    }
    const audience = targetStudents && targetTeachers ? 'BOTH' : targetStudents ? 'STUDENTS' : 'TEACHERS';

    try {
      setSending(true);
      await notificationService.sendNotification({ date, audience, message: message.trim() });
      addToast('Notification broadcast sent successfully!', 'success');
      setMessage('');
      loadHistory();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  const openEditModal = (n) => {
    setEditingNotification(n);
    setEditMessage(n.message || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editMessage.trim()) {
      addToast('Message cannot be empty', 'warning');
      return;
    }
    setSavingEdit(true);
    try {
      await notificationService.updateNotification(editingNotification.id, editMessage.trim());
      addToast('Notification updated', 'success');
      setEditingNotification(null);
      loadHistory();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update notification', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await notificationService.getHistory();
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      addToast('Failed to load notification history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const audienceLabel = (val) => {
    switch (val) {
      case 'STUDENTS': return 'Students';
      case 'TEACHERS': return 'Teachers';
      case 'BOTH': return 'All Users (Both)';
      default: return val;
    }
  };

  const audienceBadgeClass = (val) => {
    switch (val) {
      case 'STUDENTS': return 'badge-primary';
      case 'TEACHERS': return 'badge-warning';
      case 'BOTH': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Notifications' }]} />
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            Create, schedule, and broadcast school-wide announcements and communications.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadHistory}
            disabled={loadingHistory}
            title="Refresh history"
          >
            <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={14} />
            <span>{showForm ? 'Hide Form' : 'Create Notification'}</span>
          </button>
        </div>
      </div>

      {/* Broadcast Notification Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={15} color="var(--primary)" />
              Create Announcement / Notification
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSend}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Target Audience */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    Target Audience *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={targetStudents}
                        onChange={(e) => setTargetStudents(e.target.checked)}
                      />
                      Students & Parents
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={targetTeachers}
                        onChange={(e) => setTargetTeachers(e.target.checked)}
                      />
                      Teaching Faculty
                    </label>
                  </div>
                </div>

                {/* Broadcast Date */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Message Field */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  Notification Message *
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Type announcement message to broadcast..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMessage('')}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sending}
                >
                  <Send size={14} />
                  <span>{sending ? 'Broadcasting...' : 'Broadcast Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification History Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Broadcast History</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Audit log of previously broadcast communications
            </p>
          </div>
          <span className="badge badge-secondary">
            {history.length} Notification{history.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Date</th>
                <th style={{ width: '160px' }}>Target Audience</th>
                <th>Message Content</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Delivery Status</th>
                <th style={{ width: '70px', textAlign: 'right' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    Loading communications history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1.5rem' }}>
                    <Bell size={32} style={{ opacity: 0.35, display: 'block', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      No notifications sent yet.
                    </div>
                  </td>
                </tr>
              ) : (
                history.map((n) => (
                  <tr key={n.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {formatDate(n.date)}
                    </td>
                    <td>
                      <span className={`badge ${audienceBadgeClass(n.audience)}`}>
                        {audienceLabel(n.audience)}
                      </span>
                    </td>
                    <td style={{ maxWidth: '480px', lineHeight: 1.45, color: 'var(--text-main)' }}>
                      {n.message}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-success">
                        <CheckCircle2 size={11} />
                        {n.status || 'DELIVERED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(n)}
                        title="Edit message"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Notification Modal */}
      <Modal
        isOpen={!!editingNotification}
        onClose={() => setEditingNotification(null)}
        title="Edit Notification Message"
        icon={Edit2}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingNotification(null)}>Cancel</button>
            <button type="submit" form="editNotificationForm" className="btn btn-primary" disabled={savingEdit}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="editNotificationForm" onSubmit={handleSaveEdit}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Message</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              autoFocus
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
