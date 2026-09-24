import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../context/ToastContext';
import { Bell, Send, ChevronDown, Calendar } from 'lucide-react';

export const NotificationsPage = () => {
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [audience, setAudience] = useState('STUDENTS');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { addToast } = useToast();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      addToast('Please enter a notification message', 'warning');
      return;
    }

    try {
      setSending(true);
      await notificationService.sendNotification({ date, audience, message: message.trim() });
      addToast('Notification sent successfully!', 'success');
      setMessage('');
      // Refresh history if it's currently shown
      if (showHistory) {
        loadHistory();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send notification', 'error');
    } finally {
      setSending(false);
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

  const handleToggleHistory = () => {
    if (!showHistory) {
      loadHistory();
    }
    setShowHistory(!showHistory);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const audienceLabel = (val) => {
    switch (val) {
      case 'STUDENTS': return 'Students';
      case 'TEACHERS': return 'Teachers';
      case 'BOTH': return 'Both';
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
      <div className="page-header">
        <div>
          <h1 className="page-title"><Bell size={22} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />Notifications</h1>
          <p className="page-subtitle">Send notifications to Students, Teachers, or Both and view notification history.</p>
        </div>
      </div>

      {/* Send Notification Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title"><Send size={17} style={{ marginRight: 6 }} /> Send New Notification</h3>
        </div>
        <div className="card-body" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSend}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              {/* Date Picker */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} /> Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Send To Dropdown */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                  Send To
                </label>
                <select
                  className="form-select"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  required
                >
                  <option value="STUDENTS">Students</option>
                  <option value="TEACHERS">Teachers</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
            </div>

            {/* Message Textarea */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                Message
              </label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Enter notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending}
              >
                <Send size={15} /> {sending ? 'Sending...' : 'Send Notification'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleToggleHistory}
              >
                <ChevronDown size={15} style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} /> {showHistory ? 'Hide Summary' : 'View Summary'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notification History */}
      {showHistory && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Bell size={17} style={{ marginRight: 6 }} /> Notification History</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {history.length} notification{history.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sent To</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      Loading notification history...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No notifications sent yet.
                    </td>
                  </tr>
                ) : (
                  history.map((n) => (
                    <tr key={n.id}>
                      <td><strong>{formatDate(n.date)}</strong></td>
                      <td>
                        <span className={`badge ${audienceBadgeClass(n.audience)}`}>
                          {audienceLabel(n.audience)}
                        </span>
                      </td>
                      <td style={{ maxWidth: '400px' }}>{n.message}</td>
                      <td>
                        <span className="badge badge-success">{n.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
