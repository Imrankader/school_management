import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { academicService } from '../../services/academicService';
import { leaveService } from '../../services/leaveService';
import { feeService } from '../../services/feeService';
import {
  Users,
  BookOpen,
  CalendarCheck,
  DollarSign,
  ArrowRight,
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
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    studentsCount: 0,
    classesCount: 0,
    subjectsCount: 0,
    pendingLeaves: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [feeSummary, setFeeSummary] = useState({ totalBilled: 0, totalPaid: 0, totalOutstanding: 0 });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const [studentsRes, classesRes, subjectsRes, leavesRes, examsRes, feesRes] = await Promise.allSettled([
        studentService.getAllStudents({ page: 1, pageSize: 20 }),
        academicService.getAllClasses(),
        academicService.getAllSubjects(),
        leaveService.getAll(),
        academicService.getAllExams(),
        feeService.getClassBillingSummary(),
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

      // Extract Classes
      let classesList = [];
      if (classesRes.status === 'fulfilled' && classesRes.value) {
        const val = classesRes.value;
        classesList = Array.isArray(val) ? val : (val.data || []);
      }

      // Extract Subjects
      let subjectsList = [];
      if (subjectsRes.status === 'fulfilled' && subjectsRes.value) {
        const val = subjectsRes.value;
        subjectsList = Array.isArray(val) ? val : (val.data || []);
      }

      // Extract Leaves
      let leavesList = [];
      if (leavesRes.status === 'fulfilled' && leavesRes.value) {
        const val = leavesRes.value;
        leavesList = Array.isArray(val) ? val : (val.data || []);
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
          billed += Number(row.totalBilled || row.totalAmount || 0);
          paid += Number(row.totalPaid || row.collectedAmount || 0);
          outstanding += Number(row.totalOutstanding || row.pendingAmount || 0);
        });
      }

      setStats({
        studentsCount: totalStudentsCount || studentsList.length,
        classesCount: classesList.length,
        subjectsCount: subjectsList.length,
        pendingLeaves: leavesList.length,
      });

      setRecentStudents(studentsList.slice(0, 6));
      setUpcomingExams(examsList.slice(0, 4));
      setFeeSummary({ totalBilled: billed, totalPaid: paid, totalOutstanding: outstanding });
      setRecentLeaves(leavesList.slice(0, 4));
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setLoading(false);
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
            <div className="stat-label">Active Classes</div>
            <div className="stat-value">{loading ? '—' : stats.classesCount}</div>
            <div className="stat-subtext">Enrolled academic divisions</div>
          </div>
          <div className="stat-icon emerald">
            <BookOpen size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Subjects</div>
            <div className="stat-value">{loading ? '—' : stats.subjectsCount}</div>
            <div className="stat-subtext">Active curriculum courses</div>
          </div>
          <div className="stat-icon amber">
            <Award size={20} />
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

      {/* Main Grid: Recent Activity & Upcoming / Important */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Recent Activity (Students & Admissions) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Activity</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Latest student enrollments and academic directory updates
              </p>
            </div>
            <Link to="/admin/students" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Activity</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Loading activity...
                    </td>
                  </tr>
                ) : recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No recent activity recorded.
                    </td>
                  </tr>
                ) : (
                  recentStudents.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Adm: {s.admissionNumber || s.rollNumber || 'N/A'} • {s.className || 'General'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          Enrolled in {s.className || 'Class'} {s.section ? `(${s.section})` : ''}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {s.joiningDate || 'Active'}
                      </td>
                      <td>
                        <span className="badge badge-success">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Upcoming / Important */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

          {/* Recent Leave Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem' }}>
                <FileText size={16} color="var(--warning)" />
                Recent Leave Submissions
              </h3>
              <Link to="/admin/leave" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                All Records
              </Link>
            </div>
            <div style={{ padding: '0.75rem 1.25rem' }}>
              {recentLeaves.length === 0 ? (
                <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  No recent leave applications.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentLeaves.map((lv) => (
                    <div
                      key={lv.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          Student #{lv.studentId}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {lv.reason || 'Leave requested'} • {lv.startDate || 'Date not specified'}
                        </div>
                      </div>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        RECORDED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
