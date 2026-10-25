import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { studentService } from '../../services/studentService';
import { academicService } from '../../services/academicService';
import { leaveService } from '../../services/leaveService';
import { feeService } from '../../services/feeService';
import { authService } from '../../services/authService';
import {
  Users,
  CalendarCheck,
  DollarSign,
  ClipboardList,
  FileText,
  FileSpreadsheet,
  Award,
  RefreshCw,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Cake,
  GraduationCap,
  Trash2,
} from 'lucide-react';

// Days until this person's next birthday (0 = today), or null if no DOB on record.
const daysUntilNextBirthday = (dobStr) => {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
  return Math.round((next - today) / 86400000);
};

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    studentsCount: 0,
    pendingLeaves: 0,
  });
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [feeSummary, setFeeSummary] = useState({ totalBilled: 0, totalPaid: 0, totalOutstanding: 0 });
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearingData, setClearingData] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [studentsRes, leavesRes, teacherLeavesRes, examsRes, feesRes, birthdayStudentsRes, staffRes] = await Promise.allSettled([
        studentService.getAllStudents({ page: 1, pageSize: 1 }),
        leaveService.getAll(),
        leaveService.getAllTeacherLeave(),
        academicService.getAllExams(),
        feeService.getClassBillingSummary(),
        studentService.getAllStudents({ page: 1, pageSize: 10000, status: 'Active' }),
        authService.getStaffAccounts(),
      ]);

      // Extract Students
      let studentsList = [];
      let totalStudentsCount = 0;
      if (studentsRes.status === 'fulfilled' && studentsRes.value) {
        const val = studentsRes.value;
        if (val.success && val.data) {
          studentsList = val.data.data || (Array.isArray(val.data) ? val.data : []);
          totalStudentsCount = val.data.pagination?.total || studentsList.length;
        } else if (val.data) {
          studentsList = Array.isArray(val.data) ? val.data : (val.data.data || []);
          totalStudentsCount = val.data.pagination?.total || studentsList.length;
        }
      }

      // Extract Leaves (student leave, submitted by parents)
      let leavesList = [];
      if (leavesRes.status === 'fulfilled' && leavesRes.value) {
        const val = leavesRes.value;
        leavesList = Array.isArray(val) ? val : (val.data || []);
      }

      // Extract Teacher Leaves
      let teacherLeavesList = [];
      if (teacherLeavesRes.status === 'fulfilled' && teacherLeavesRes.value) {
        const val = teacherLeavesRes.value;
        teacherLeavesList = Array.isArray(val) ? val : (val.data || []);
      }

      // Extract Exams
      let examsList = [];
      if (examsRes.status === 'fulfilled' && examsRes.value) {
        const val = examsRes.value;
        examsList = Array.isArray(val) ? val : (val.data || []);
      }

      // Extract Fees
      let billed = 0;
      let paid = 0;
      let outstanding = 0;
      if (feesRes.status === 'fulfilled' && feesRes.value) {
        const fData = Array.isArray(feesRes.value) ? feesRes.value : (feesRes.value.data || []);
        fData.forEach((row) => {
          billed += Number(row.totalAmount || 0);
          paid += Number(row.totalPaidAmount || 0);
          outstanding += Number(row.totalOutstandingAmount || 0);
        });
      }

      // Upcoming Birthdays (students + teachers, next 30 days, soonest first)
      let birthdayStudentsList = [];
      if (birthdayStudentsRes.status === 'fulfilled' && birthdayStudentsRes.value) {
        const val = birthdayStudentsRes.value;
        birthdayStudentsList = val.data?.data || (Array.isArray(val.data) ? val.data : []);
      }
      let staffList = [];
      if (staffRes.status === 'fulfilled' && staffRes.value) {
        const val = staffRes.value;
        staffList = val.success && val.data ? val.data : [];
      }
      const birthdayPeople = [
        ...birthdayStudentsList.map((s) => ({ name: s.name, kind: 'student', dob: s.dateOfBirth, meta: s.className ? `${s.className}${s.section ? ` (${s.section})` : ''}` : '' })),
        ...staffList.filter((s) => s.role === 'TEACHER').map((s) => ({ name: s.name, kind: 'teacher', dob: s.dateOfBirth, meta: 'Teacher' })),
      ]
        .map((p) => ({ ...p, daysUntil: daysUntilNextBirthday(p.dob) }))
        .filter((p) => p.daysUntil !== null && p.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil || (a.name || '').localeCompare(b.name || ''));

      setStats({
        studentsCount: totalStudentsCount || studentsList.length,
        pendingLeaves: leavesList.length + teacherLeavesList.length,
      });

      setUpcomingExams(examsList.slice(0, 4));
      setFeeSummary({ totalBilled: billed, totalPaid: paid, totalOutstanding: outstanding });
      setUpcomingBirthdays(birthdayPeople.slice(0, 8));
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  // Permanently deletes every student record in the school. No undo.
  const handleClearAllData = async () => {
    if (stats.studentsCount === 0) {
      addToast('There are no students to clear.', 'info');
      return;
    }
    const firstConfirm = window.confirm(
      `Are you sure you want to clear ALL student data? This will permanently delete all ${stats.studentsCount} student records across every class.`
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      `This cannot be undone. ${stats.studentsCount} student records will be permanently removed right now. Click OK to proceed.`
    );
    if (!secondConfirm) return;

    try {
      setClearingData(true);
      const res = await studentService.clearAllStudents();
      const deletedCount = res?.data?.deletedCount ?? stats.studentsCount;
      addToast(`Cleared ${deletedCount} student record(s).`, 'success');
      await loadDashboardData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to clear student data', 'error');
    } finally {
      setClearingData(false);
    }
  };

  const adminName = user?.name || user?.username || 'Admin';

  return (
    <div>
      {/* Top Section: Welcome / School Overview */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {getGreeting()}, {adminName}
          </h1>
          <p className="page-subtitle" style={{ fontSize: '0.875rem' }}>
            Here's what's happening across your school today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            title="Refresh dashboard data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClearAllData}
            disabled={clearingData}
            className="btn btn-danger btn-sm"
            title="Permanently delete every student record"
          >
            <Trash2 size={13} />
            <span>{clearingData ? 'Clearing...' : 'Clear Data'}</span>
          </button>
        </div>
      </div>

      {/* Compact Metric Cards (Clean, uniform, enterprise design) */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Students</div>
            <div className="stat-value">{loading ? '—' : stats.studentsCount}</div>
            <div className="stat-subtext">Total active enrolled students</div>
          </div>
          <div className="stat-icon indigo">
            <Users size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Leave Records</div>
            <div className="stat-value">{loading ? '—' : stats.pendingLeaves}</div>
            <div className="stat-subtext">Recorded parent leaves</div>
          </div>
          <div className="stat-icon rose">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quick Actions
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <Link
            to="/admin/students"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Users size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Add Student
              </span>
            </div>
          </Link>

          <Link
            to="/admin/marks"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Award size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Enter Marks
              </span>
            </div>
          </Link>

          <Link
            to="/admin/fees"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--success)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <DollarSign size={16} color="var(--success)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Create Billing
              </span>
            </div>
          </Link>

          <Link
            to="/admin/homework"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <ClipboardList size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Create Homework
              </span>
            </div>
          </Link>

          <Link
            to="/admin/leave"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--warning)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <FileText size={16} color="var(--warning)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Manage Leave
              </span>
            </div>
          </Link>

          <Link
            to="/admin/import-export"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <FileSpreadsheet size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Import Data
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Upcoming / Important */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Upcoming Examinations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem' }}>
              <Calendar size={16} color="var(--primary)" />
              Upcoming Examinations
            </h3>
            <Link to="/admin/marks" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Manage
            </Link>
          </div>
          <div style={{ padding: '0.75rem 1.25rem' }}>
            {upcomingExams.length === 0 ? (
              <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No upcoming exams scheduled.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {exam.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={11} />
                        {exam.examDate ? new Date(exam.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled'}
                      </div>
                    </div>
                    <span className="badge badge-primary">
                      {exam.totalMarks || 100} Marks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Fees & Financial Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem' }}>
              <DollarSign size={16} color="var(--success)" />
              Financial Collection Overview
            </h3>
            <Link to="/admin/fees" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Billing
            </Link>
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ padding: '0.65rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>Collected</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>
                  ₹{feeSummary.totalPaid.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '0.65rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>Outstanding</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: feeSummary.totalOutstanding > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
                  ₹{feeSummary.totalOutstanding.toLocaleString()}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Invoiced</span>
              <strong>₹{feeSummary.totalBilled.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem' }}>
              <Cake size={16} color="var(--warning)" />
              Upcoming Birthdays
            </h3>
            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Next 30 days</span>
          </div>
          <div style={{ padding: '0.75rem 1.25rem' }}>
            {upcomingBirthdays.length === 0 ? (
              <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No birthdays in the next 30 days.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {upcomingBirthdays.map((p, idx) => {
                  const isTeacher = p.kind === 'teacher';
                  const when = p.daysUntil === 0 ? 'Today' : p.daysUntil === 1 ? 'Tomorrow' : `In ${p.daysUntil} days`;
                  return (
                    <div
                      key={`${p.kind}-${p.name}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {isTeacher ? <GraduationCap size={13} color="var(--primary)" /> : <Users size={13} color="var(--text-muted)" />}
                          {p.name}
                          <span className={`badge ${isTeacher ? 'badge-primary' : 'badge-secondary'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            {isTeacher ? 'Teacher' : 'Student'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.meta}
                        </div>
                      </div>
                      <span className={`badge ${p.daysUntil === 0 ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '0.7rem' }}>
                        {when}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
