import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import { useToast } from '../../context/ToastContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { toDisplayClassName } from '../../utils/academicClassOrder';
import { FileText, Search, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Teacher Portal — Leave Records Page
 * 
 * Displays student absence records submitted by parents for students belonging
 * to the teacher's assigned class/section.
 * 
 * Strict Read-Only:
 * - NO approve/reject workflow
 * - NO pending status
 * - Status is always RECORDED
 */
export const TeacherLeavePage = () => {
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadTeacherLeaves();
  }, []);

  const loadTeacherLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getTeacherLeaves();
      if (res && res.success && Array.isArray(res.data)) {
        setLeaveRecords(res.data);
      } else if (Array.isArray(res)) {
        setLeaveRecords(res);
      } else {
        setLeaveRecords([]);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load leave records for your class', 'error');
      setLeaveRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Search filter supporting Student Name, Admission Number, Class, Section, Reason, Leave Date
  const filtered = leaveRecords.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const studentName = (r.studentName || '').toLowerCase();
    const admissionNo = (r.admissionNumber || '').toLowerCase();
    const className = (r.className || '').toLowerCase();
    const displayClass = toDisplayClassName(r.className || '').toLowerCase();
    const section = (r.section || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();
    const leaveDate = (r.leaveDate || r.startDate || '').toLowerCase();
    const recordId = String(r.recordId || r.id || '');

    return (
      studentName.includes(term) ||
      admissionNo.includes(term) ||
      className.includes(term) ||
      displayClass.includes(term) ||
      section.includes(term) ||
      reason.includes(term) ||
      leaveDate.includes(term) ||
      recordId.includes(term)
    );
  });

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Teacher Portal', path: '/teacher' },
          { label: 'Leave Records' },
        ]}
      />

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Leave Records</h1>
          <p className="page-subtitle">
            Student absence records submitted by parents.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-secondary" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }}>
            {leaveRecords.length} Class Records
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadTeacherLeaves}
            disabled={loading}
            title="Refresh leave records"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div
        className="card"
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <Search size={15} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search by student name, admission number, class, section, or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, border: 'none', padding: '0.25rem 0', boxShadow: 'none' }}
        />
        {searchTerm && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setSearchTerm('')}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Teacher Leave Records Table */}
      <div className="table-container">
        <table className="table" style={{ width: '100%', minWidth: '780px' }}>
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Record #</th>
              <th>Student Name</th>
              <th>Admission No</th>
              <th>Class & Section</th>
              <th>Leave Date</th>
              <th>Reason</th>
              <th>Submitted On</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1.5rem' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ display: 'block', margin: '0 auto 0.75rem' }} />
                  <div>Loading class leave records...</div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1.5rem' }}>
                  <FileText size={32} style={{ opacity: 0.35, display: 'block', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {searchTerm ? 'No leave records match your search query.' : 'No student leave records for your assigned class.'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    {searchTerm ? 'Try adjusting your search criteria.' : 'Leave submissions by parents will appear here automatically.'}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((record) => {
                const recId = record.recordId || record.id;
                const studentName = record.studentName || `Student #${record.studentId}`;
                const admissionNo = record.admissionNumber || '—';
                const classDisplay = record.className
                  ? `${toDisplayClassName(record.className)}${record.section ? ` (${record.section})` : ''}`
                  : '—';
                const leaveDate = record.leaveDate || record.startDate || '—';
                const submittedOn = record.submittedAt || record.createdAt ? formatDate(record.submittedAt || record.createdAt) : '—';
                const status = 'RECORDED';

                return (
                  <tr key={recId}>
                    <td>
                      <strong>#{recId}</strong>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {studentName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {admissionNo}
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {classDisplay}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {leaveDate}
                    </td>
                    <td style={{ maxWidth: '300px', fontSize: '0.875rem' }}>
                      {record.reason || '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {submittedOn}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-primary">
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
