import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { toDisplayClassName } from '../../utils/academicClassOrder';
import { CalendarCheck2, FileText, Search, RefreshCw, User } from 'lucide-react';

/**
 * Admin Leave Records page.
 * Read-only view of all submitted leave records.
 * NO approve/reject workflow — leave is recorded directly when parent submits.
 */
export const LeaveRequestsPage = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const [res, stuRes] = await Promise.allSettled([
        leaveService.getAll(),
        studentService.getAllStudents({ page: 1, pageSize: 250 }),
      ]);

      if (res.status === 'fulfilled' && res.value?.success && res.value.data) {
        setLeaveRequests(res.value.data);
      } else {
        setLeaveRequests([]);
      }

      if (stuRes.status === 'fulfilled' && stuRes.value) {
        const val = stuRes.value;
        const list = val.data?.data || (Array.isArray(val.data) ? val.data : []);
        const map = {};
        list.forEach((s) => {
          map[s.id] = s;
        });
        setStudentsMap(map);
      }
    } catch (err) {
      addToast('Failed to load leave records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = leaveRequests.filter((r) => {
    const term = searchTerm.toLowerCase();
    const stu = studentsMap[r.studentId];
    return (
      String(r.studentId).includes(term) ||
      (r.reason || '').toLowerCase().includes(term) ||
      (r.startDate || '').includes(term) ||
      (stu?.name || '').toLowerCase().includes(term) ||
      (stu?.admissionNumber || '').toLowerCase().includes(term) ||
      (stu?.className || '').toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Leave Records' }]} />

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Leave Records</h1>
          <p className="page-subtitle">
            Submitted student absence records from parents — recorded directly into the system.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-secondary" style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }}>
            {leaveRequests.length} Total Records
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadLeaveRequests}
            disabled={loading}
            title="Refresh leave records"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <Search size={15} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search by student name, admission no, class, or reason..."
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

      {/* Leave Table */}
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1.5rem' }}>
                  <FileText size={32} style={{ opacity: 0.35, display: 'block', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {loading ? 'Loading leave records...' : searchTerm ? 'No records match your search.' : 'No leave records submitted yet.'}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((req) => {
                const stu = studentsMap[req.studentId];
                const recId = req.recordId || req.id;
                const studentName = req.studentName || stu?.name || `Student #${req.studentId}`;
                const admissionNo = req.admissionNumber || stu?.admissionNumber || '—';
                const rawClass = req.className || stu?.className;
                const section = req.section || stu?.section || '';
                const classDisplay = rawClass
                  ? `${toDisplayClassName(rawClass)}${section ? ` (${section})` : ''}`
                  : '—';
                const leaveDate = req.leaveDate || req.startDate || '—';
                const submittedOn = req.submittedAt || req.createdAt ? formatDate(req.submittedAt || req.createdAt) : '—';

                return (
                  <tr key={recId}>
                    <td><strong>#{recId}</strong></td>
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
                      {req.reason || '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {submittedOn}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-primary">
                        RECORDED
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
