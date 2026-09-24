import React, { useState, useEffect, useMemo } from 'react';
import { feeService } from '../../services/feeService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { BulkBillingUploadModal } from '../../components/billing/BulkBillingUploadModal';
import { IndividualBillingModal } from '../../components/billing/IndividualBillingModal';
import {
  DollarSign,
  Plus,
  Upload,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowLeft,
  ChevronRight,
  Layers,
  CreditCard,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  RotateCcw,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users
} from 'lucide-react';

export const FeesPage = () => {
  // Navigation View: 'classes' (main ERP overview) | 'class-details' (detailed class breakdown)
  const [view, setView] = useState('classes');
  const [selectedClass, setSelectedClass] = useState('');

  // Class Summary Data
  const [classSummaries, setClassSummaries] = useState([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Recent Payments Data (Section 4)
  const [recentPayments, setRecentPayments] = useState([]);
  const [loadingRecentPayments, setLoadingRecentPayments] = useState(false);

  // Filters for Main View
  const [academicYearFilter, setAcademicYearFilter] = useState('2026-2027');
  const [classFilter, setClassFilter] = useState('All');
  const [mainStatusFilter, setMainStatusFilter] = useState('All');
  const [mainSearchTerm, setMainSearchTerm] = useState('');

  // Student Billing Data for Selected Class
  const [studentBillingRows, setStudentBillingRows] = useState([]);
  const [activeStudentsInClass, setActiveStudentsInClass] = useState([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [classDetailsError, setClassDetailsError] = useState(null);

  // Search & Filter within Selected Class
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [classStudentStatusFilter, setClassStudentStatusFilter] = useState('All');

  // Expanded Row IDs for breakdown details
  const [expandedRows, setExpandedRows] = useState({});

  // Pagination for Selected Class Student Billing
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modals
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkModalClass, setBulkModalClass] = useState('');
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
  const [individualModalStudent, setIndividualModalStudent] = useState(null);

  // Record Payment Modal
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'ONLINE',
    note: '',
  });

  // Payment History Modal
  const [historyModal, setHistoryModal] = useState(false);
  const [historyFee, setHistoryFee] = useState(null);
  const [paymentsList, setPaymentsList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadClassSummaries();
    loadRecentPayments();
  }, []);

  const loadClassSummaries = async () => {
    try {
      setLoadingSummaries(true);
      setSummaryError(null);
      const res = await feeService.getClassBillingSummary();
      if (res && res.success && Array.isArray(res.data)) {
        setClassSummaries(res.data);
      } else if (Array.isArray(res)) {
        setClassSummaries(res);
      } else {
        setClassSummaries([]);
      }
    } catch (err) {
      console.error('Failed to load class billing summaries:', err);
      setSummaryError('Unable to load billing data. Please try again.');
      setClassSummaries([]);
    } finally {
      setLoadingSummaries(false);
    }
  };

  const loadRecentPayments = async () => {
    try {
      setLoadingRecentPayments(true);
      const res = await feeService.getRecentPayments(10);
      if (res && res.success && Array.isArray(res.data)) {
        setRecentPayments(res.data);
      } else if (Array.isArray(res)) {
        setRecentPayments(res);
      } else {
        setRecentPayments([]);
      }
    } catch (err) {
      console.error('Failed to load recent payments:', err);
      setRecentPayments([]);
    } finally {
      setLoadingRecentPayments(false);
    }
  };

  const loadStudentBillingForClass = async (className) => {
    try {
      setLoadingClassStudents(true);
      setClassDetailsError(null);
      setClassSearchTerm('');
      setClassStudentStatusFilter('All');
      setCurrentPage(1);
      setExpandedRows({});

      const [billingRes, studentsRes] = await Promise.allSettled([
        feeService.getStudentBillingByClass(className),
        studentService.getActiveStudentsByClass(className),
      ]);

      if (billingRes.status === 'fulfilled' && billingRes.value?.success && billingRes.value?.data) {
        setStudentBillingRows(billingRes.value.data);
      } else {
        setStudentBillingRows([]);
      }

      if (studentsRes.status === 'fulfilled' && studentsRes.value?.success && studentsRes.value?.data) {
        setActiveStudentsInClass(studentsRes.value.data);
      } else {
        setActiveStudentsInClass([]);
      }
    } catch (err) {
      console.error(`Failed to load student billing for ${className}:`, err);
      setClassDetailsError(`Unable to load student billing records for ${className}. Please try again.`);
      setStudentBillingRows([]);
    } finally {
      setLoadingClassStudents(false);
    }
  };

  const handleOpenClassDetails = (className) => {
    setSelectedClass(className);
    setView('class-details');
    loadStudentBillingForClass(className);
  };

  const handleBackToClasses = () => {
    setView('classes');
    setSelectedClass('');
    loadClassSummaries();
    loadRecentPayments();
  };

  const toggleRowExpand = (sNo) => {
    setExpandedRows((prev) => ({
      ...prev,
      [sNo]: !prev[sNo],
    }));
  };

  // Currency Formatter
  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return '₹ ' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Financial Aggregates
  const financialOverview = useMemo(() => {
    const totalStudents = classSummaries.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
    const totalBilled = classSummaries.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const totalCollected = classSummaries.reduce((sum, c) => sum + (c.totalPaidAmount || 0), 0);
    const totalOutstanding = classSummaries.reduce((sum, c) => sum + (c.totalOutstandingAmount || 0), 0);

    const collectionRate = totalBilled > 0
      ? ((totalCollected / totalBilled) * 100).toFixed(1)
      : '0.0';

    return {
      totalStudents,
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate: parseFloat(collectionRate),
    };
  }, [classSummaries]);

  // Distinct class list for filter dropdown
  const distinctClasses = useMemo(() => {
    return classSummaries.map((c) => c.className).filter(Boolean);
  }, [classSummaries]);

  // Filtered Class Summaries
  const filteredClassSummaries = useMemo(() => {
    return classSummaries.filter((row) => {
      const q = mainSearchTerm.trim().toLowerCase();
      const matchSearch = !q || (row.className && row.className.toLowerCase().includes(q));
      const matchClass = classFilter === 'All' || row.className === classFilter;

      let rowStatus = 'Unbilled';
      if ((row.totalAmount || 0) === 0) {
        rowStatus = 'Unbilled';
      } else if ((row.totalOutstandingAmount || 0) === 0) {
        rowStatus = 'Cleared';
      } else if ((row.totalPaidAmount || 0) > 0) {
        rowStatus = 'Partial';
      } else {
        rowStatus = 'Pending';
      }

      const matchStatus = mainStatusFilter === 'All' || mainStatusFilter === rowStatus;
      return matchSearch && matchClass && matchStatus;
    });
  }, [classSummaries, mainSearchTerm, classFilter, mainStatusFilter]);

  // Filtered & Paginated Student Billing Rows within Selected Class
  const filteredBillingRows = useMemo(() => {
    return studentBillingRows.filter((row) => {
      const q = classSearchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        (row.studentName && row.studentName.toLowerCase().includes(q)) ||
        (row.admissionNumber && row.admissionNumber.toLowerCase().includes(q));

      const matchStatus =
        classStudentStatusFilter === 'All' ||
        (classStudentStatusFilter === 'Settled' && (row.status === 'settled' || row.status === 'PAID')) ||
        (classStudentStatusFilter === 'Partially Paid' && (row.status === 'partially paid' || row.status === 'PARTIAL')) ||
        (classStudentStatusFilter === 'Pending' && (row.status === 'pending' || row.status === 'PENDING')) ||
        (classStudentStatusFilter === 'Unbilled' && row.status === 'unbilled');

      return matchSearch && matchStatus;
    });
  }, [studentBillingRows, classSearchTerm, classStudentStatusFilter]);

  const totalPages = Math.ceil(filteredBillingRows.length / pageSize) || 1;
  const paginatedBillingRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBillingRows.slice(start, start + pageSize);
  }, [filteredBillingRows, currentPage]);

  // Selected Class Aggregates
  const classMetrics = useMemo(() => {
    const count = studentBillingRows.length;
    const billed = studentBillingRows.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const paid = studentBillingRows.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const outstanding = studentBillingRows.reduce((sum, r) => sum + (r.outstandingAmount || 0), 0);
    const rate = billed > 0 ? ((paid / billed) * 100).toFixed(1) : '0.0';
    return { count, billed, paid, outstanding, rate };
  }, [studentBillingRows]);

  // Status Badge Helper for Class Table
  const getClassStatusBadge = (row) => {
    const total = row.totalAmount || 0;
    const pending = row.totalOutstandingAmount || 0;
    const paid = row.totalPaidAmount || 0;

    if (total === 0) {
      return (
        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
          }}
        >
          Unbilled
        </span>
      );
    }
    if (pending === 0 && paid > 0) {
      return (
        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#ecfdf5',
            color: '#047857',
            border: '1px solid #a7f3d0',
          }}
        >
          Cleared
        </span>
      );
    }
    if (paid > 0 && pending > 0) {
      return (
        <span
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a',
          }}
        >
          Partially Paid
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '0.2rem 0.6rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
        }}
      >
        Pending
      </span>
    );
  };

  // Status Badge for Student Row
  const renderStudentStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'settled' || s === 'paid') {
      return (
        <span
          style={{
            backgroundColor: '#ecfdf5',
            color: '#047857',
            border: '1px solid #a7f3d0',
            borderRadius: '4px',
            padding: '0.2rem 0.55rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Settled
        </span>
      );
    }
    if (s === 'partially paid' || s === 'partial') {
      return (
        <span
          style={{
            backgroundColor: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a',
            borderRadius: '4px',
            padding: '0.2rem 0.55rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Partially Paid
        </span>
      );
    }
    if (s === 'pending' || s === 'outstanding') {
      return (
        <span
          style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            padding: '0.2rem 0.55rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Outstanding
        </span>
      );
    }
    return (
      <span
        style={{
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '0.2rem 0.55rem',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        Unbilled
      </span>
    );
  };

  // Open Payment Modal
  const openPaymentModal = (row) => {
    setSelectedFeeForPayment(row);
    const remaining = row.outstandingAmount || 0;
    setPaymentForm({
      amountPaid: remaining > 0 ? remaining : 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'ONLINE',
      note: 'Tuition installment',
    });
    setPaymentModal(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFeeForPayment?.feeId) {
      addToast('Please save billing for this student before recording a payment.', 'error');
      return;
    }
    try {
      await feeService.recordPayment(selectedFeeForPayment.feeId, {
        amountPaid: parseFloat(paymentForm.amountPaid),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        note: paymentForm.note,
      });
      addToast('Payment recorded successfully!', 'success');
      setPaymentModal(false);
      setSelectedFeeForPayment(null);
      loadStudentBillingForClass(selectedClass);
      loadRecentPayments();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to record payment.', 'error');
    }
  };

  const openHistoryModal = async (row) => {
    setHistoryFee(row);
    setHistoryModal(true);
    if (!row.feeId) {
      setPaymentsList([]);
      return;
    }
    try {
      setLoadingHistory(true);
      const res = await feeService.getPaymentsByFee(row.feeId);
      if (res && res.success && Array.isArray(res.data)) {
        setPaymentsList(res.data);
      } else if (Array.isArray(res)) {
        setPaymentsList(res);
      } else {
        setPaymentsList([]);
      }
    } catch (err) {
      setPaymentsList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenBulkForClass = (clsName) => {
    setBulkModalClass(clsName || (distinctClasses[0] || ''));
    setIsBulkModalOpen(true);
  };

  return (
    <div className="page-container" style={{ padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* ========================================================================= */}
      {/* 1. MAIN ERP BILLING MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {view === 'classes' && (
        <div>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.25rem' }}>
                <span>Finance</span>
                <span>/</span>
                <span style={{ color: 'var(--primary)' }}>Billing & Fee Management</span>
              </div>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                Billing & Fee Management
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
                Manage student fee structures, collections, payments and outstanding balances.
              </p>
            </div>

            {/* SECTION 5 — QUICK ACTIONS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
                onClick={() => {
                  loadClassSummaries();
                  loadRecentPayments();
                }}
                disabled={loadingSummaries}
                title="Reload financial and billing data"
              >
                <RotateCcw size={15} className={loadingSummaries ? 'animate-spin' : ''} />
                Refresh
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
                onClick={() => handleOpenBulkForClass('')}
              >
                <Upload size={15} />
                Bulk Upload
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                onClick={() => {
                  if (distinctClasses.length > 0) {
                    handleOpenClassDetails(distinctClasses[0]);
                  }
                }}
              >
                <Layers size={15} />
                Manage Class Billing
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {summaryError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#991b1b',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{summaryError}</span>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                style={{ backgroundColor: '#ffffff', color: '#991b1b', borderColor: '#fca5a5' }}
                onClick={loadClassSummaries}
              >
                Retry
              </button>
            </div>
          )}

          {/* SECTION 1 & 3: COMPACT PROFESSIONAL ERP FINANCIAL OVERVIEW & COLLECTION SUMMARY */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Section 1: Financial Overview Box */}
            <div
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '0.75rem',
                  marginBottom: '0.85rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '0.01em' }}>
                  Financial Overview
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  AY: {academicYearFilter}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Billed</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(financialOverview.totalBilled)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Collected</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#047857', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(financialOverview.totalCollected)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Outstanding</span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: financialOverview.totalOutstanding > 0 ? '#b91c1c' : '#047857',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCurrency(financialOverview.totalOutstanding)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px dashed var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Collection Rate</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {financialOverview.collectionRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Collection Progress & Summary */}
            <div
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.75rem',
                    marginBottom: '0.85rem',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '0.01em' }}>
                    Collection Summary
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {financialOverview.totalStudents} Active Students Billed
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                    <span style={{ color: '#047857' }}>
                      Collected: {formatCurrency(financialOverview.totalCollected)}
                    </span>
                    <span style={{ color: financialOverview.totalOutstanding > 0 ? '#b91c1c' : 'var(--text-muted)' }}>
                      Outstanding: {formatCurrency(financialOverview.totalOutstanding)}
                    </span>
                  </div>

                  <div
                    style={{
                      height: '10px',
                      backgroundColor: '#fee2e2',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(financialOverview.collectionRate, 100)}%`,
                        backgroundColor: '#10b981',
                        transition: 'width 0.4s ease',
                      }}
                      title={`Collected: ${financialOverview.collectionRate}%`}
                    />
                  </div>
                </div>
              </div>

              {/* Status breakdown pills */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <div style={{ padding: '0.4rem 0.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Classes
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {classSummaries.length}
                  </div>
                </div>

                <div style={{ padding: '0.4rem 0.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Full Settled
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#047857' }}>
                    {classSummaries.filter((c) => (c.totalAmount || 0) > 0 && (c.totalOutstandingAmount || 0) === 0).length}
                  </div>
                </div>

                <div style={{ padding: '0.4rem 0.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    With Dues
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#b91c1c' }}>
                    {classSummaries.filter((c) => (c.totalOutstandingAmount || 0) > 0).length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS & SEARCH TOOLBAR */}
          <div
            className="card"
            style={{
              padding: '0.85rem 1.25rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {/* Left: Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                <Filter size={15} />
                <span style={{ fontWeight: 600 }}>Filters:</span>
              </div>

              {/* Academic Year */}
              <select
                className="form-select"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem', height: '34px', width: 'auto' }}
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
              >
                <option value="2026-2027">AY 2026-2027</option>
                <option value="2025-2026">AY 2025-2026</option>
              </select>

              {/* Class Dropdown */}
              <select
                className="form-select"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem', height: '34px', width: 'auto' }}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="All">All Classes</option>
                {distinctClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                className="form-select"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem', height: '34px', width: 'auto' }}
                value={mainStatusFilter}
                onChange={(e) => setMainStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Cleared">Cleared</option>
                <option value="Partial">Partially Paid</option>
                <option value="Pending">Pending</option>
                <option value="Unbilled">Unbilled</option>
              </select>
            </div>

            {/* Right: Search */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search class..."
                className="form-input"
                style={{
                  paddingLeft: '2.2rem',
                  paddingRight: '0.75rem',
                  fontSize: '0.825rem',
                  height: '34px',
                }}
                value={mainSearchTerm}
                onChange={(e) => setMainSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 2 — CLASS BILLING SUMMARY TABLE */}
          <div
            className="card"
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={17} style={{ color: 'var(--primary)' }} />
                Class Billing Summary
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {filteredClassSummaries.length} of {classSummaries.length} classes
              </div>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', width: '60px', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Class</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Students</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Billed</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Paid</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Outstanding</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '130px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Collection %</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '110px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '140px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSummaries ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <RotateCcw size={22} className="animate-spin text-primary" />
                          <span style={{ fontSize: '0.9rem' }}>Loading billing data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredClassSummaries.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <FileSpreadsheet size={32} style={{ opacity: 0.35 }} />
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            No billing records available
                          </span>
                          <span style={{ fontSize: '0.825rem' }}>
                            {classSummaries.length === 0
                              ? 'No classes or student billing configured yet.'
                              : 'No classes match the selected filter criteria.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClassSummaries.map((item, idx) => {
                      const billed = item.totalAmount || 0;
                      const paid = item.totalPaidAmount || 0;
                      const outstanding = item.totalOutstandingAmount || 0;
                      const pct = billed > 0 ? Math.min(100, (paid / billed) * 100) : 0;

                      return (
                        <tr
                          key={item.className || idx}
                          style={{ transition: 'background-color 0.12s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                            {item.sNo || idx + 1}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            <span
                              style={{
                                backgroundColor: '#f1f5f9',
                                color: '#1e293b',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                              }}
                            >
                              {item.className}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-main)' }}>
                            {item.totalStudents || 0}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(billed)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#047857', fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(paid)}
                          </td>
                          <td
                            style={{
                              padding: '0.85rem 1rem',
                              textAlign: 'right',
                              fontWeight: 600,
                              color: outstanding > 0 ? '#b91c1c' : '#047857',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {formatCurrency(outstanding)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                              <div
                                style={{
                                  width: '50px',
                                  height: '6px',
                                  backgroundColor: '#e2e8f0',
                                  borderRadius: '9999px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: '100%',
                                    backgroundColor: pct >= 100 ? '#10b981' : '#f59e0b',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            {getClassStatusBadge(item)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  fontSize: '0.775rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  fontWeight: 600,
                                  color: 'var(--primary)',
                                }}
                                onClick={() => handleOpenClassDetails(item.className)}
                              >
                                View <ChevronRight size={13} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.775rem',
                                  color: 'var(--text-muted)',
                                }}
                                title={`Upload Excel for ${item.className}`}
                                onClick={() => handleOpenBulkForClass(item.className)}
                              >
                                <Upload size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4 — RECENT PAYMENTS */}
          <div
            className="card"
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={17} style={{ color: '#047857' }} />
                Recent Payments
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Latest transactions
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={loadRecentPayments}
                  disabled={loadingRecentPayments}
                >
                  <RotateCcw size={12} className={loadingRecentPayments ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Student</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Class</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Payment Date</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Method</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRecentPayments ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                          <RotateCcw size={18} className="animate-spin text-primary" />
                          <span style={{ fontSize: '0.85rem' }}>Loading recent transactions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                          <CreditCard size={28} style={{ opacity: 0.35 }} />
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            No recent payments recorded
                          </span>
                          <span style={{ fontSize: '0.8rem' }}>Payments collected will appear here automatically.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            {p.studentName || 'Student #' + p.studentId}
                          </div>
                          {p.admissionNumber && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Adm: {p.admissionNumber}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.825rem', color: 'var(--text-main)' }}>
                          <span
                            style={{
                              backgroundColor: '#f1f5f9',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '3px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {p.className || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#047857', fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem' }}>
                          {formatCurrency(p.amountPaid)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          {formatDate(p.paymentDate)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '3px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              textTransform: 'uppercase',
                            }}
                          >
                            {p.paymentMethod || 'ONLINE'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '3px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                            }}
                          >
                            Paid
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.note || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SELECTED CLASS STUDENT BILLING VIEW (CLASS DETAILS) */}
      {/* ========================================================================= */}
      {view === 'class-details' && (
        <div>
          {/* Breadcrumb & Top Bar */}
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={handleBackToClasses}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Finance
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={handleBackToClasses}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Billing & Fee Management
              </button>
              <span>/</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{selectedClass}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  type="button"
                  onClick={handleBackToClasses}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.825rem',
                  }}
                >
                  <ArrowLeft size={15} /> Back to Summary
                </button>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {selectedClass} — Student Billing Records
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '2px 0 0' }}>
                    Active enrolled students in {selectedClass} and detailed fee breakdown.
                  </p>
                </div>
              </div>

              {/* Quick Actions for Class */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => handleOpenBulkForClass(selectedClass)}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 600,
                    padding: '0.5rem 0.95rem',
                    fontSize: '0.825rem',
                  }}
                >
                  <Upload size={15} /> Bulk Upload
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIndividualModalStudent(null);
                    setIsIndividualModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 600,
                    padding: '0.5rem 1rem',
                    fontSize: '0.825rem',
                  }}
                >
                  <Plus size={15} /> Add Individual Billing
                </button>
              </div>
            </div>
          </div>

          {/* Class Error Banner */}
          {classDetailsError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.25rem',
                color: '#991b1b',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{classDetailsError}</span>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => loadStudentBillingForClass(selectedClass)}
              >
                Retry
              </button>
            </div>
          )}

          {/* Selected Class Compact Summary Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div className="card" style={{ padding: '0.9rem 1.25rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Enrolled Students
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {classMetrics.count}
              </div>
            </div>

            <div className="card" style={{ padding: '0.9rem 1.25rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Invoiced
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {formatCurrency(classMetrics.billed)}
              </div>
            </div>

            <div className="card" style={{ padding: '0.9rem 1.25rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Collected
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#047857', marginTop: '0.2rem' }}>
                {formatCurrency(classMetrics.paid)}
              </div>
            </div>

            <div className="card" style={{ padding: '0.9rem 1.25rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Outstanding Dues
              </div>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: classMetrics.outstanding > 0 ? '#b91c1c' : '#047857',
                  marginTop: '0.2rem',
                }}
              >
                {formatCurrency(classMetrics.outstanding)}
              </div>
            </div>
          </div>

          {/* Search & Status Filter within Class */}
          <div
            className="card"
            style={{
              padding: '0.85rem 1.25rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search student or roll no..."
                className="form-input"
                style={{
                  paddingLeft: '2.2rem',
                  paddingRight: '0.75rem',
                  fontSize: '0.825rem',
                  height: '34px',
                }}
                value={classSearchTerm}
                onChange={(e) => {
                  setClassSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Status:
              </span>
              <select
                className="form-select"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem', height: '34px', width: 'auto' }}
                value={classStudentStatusFilter}
                onChange={(e) => {
                  setClassStudentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Settled">Settled</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
                <option value="Unbilled">Unbilled</option>
              </select>
            </div>
          </div>

          {/* Student Billing Table */}
          <div
            className="card"
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', width: '40px' }}></th>
                    <th style={{ padding: '0.75rem 1rem', width: '50px', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Roll / Adm No</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Billed</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Paid</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Outstanding</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '120px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '220px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingClassStudents ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <RotateCcw size={22} className="animate-spin text-primary" />
                          <span style={{ fontSize: '0.9rem' }}>Loading class student billing records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedBillingRows.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={32} style={{ opacity: 0.35 }} />
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            No student billing records found
                          </span>
                          <span style={{ fontSize: '0.825rem' }}>
                            {studentBillingRows.length === 0
                              ? `No active students are currently enrolled in ${selectedClass}.`
                              : 'No students match your filter criteria.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBillingRows.map((row) => {
                      const isExpanded = !!expandedRows[row.sNo];
                      return (
                        <React.Fragment key={row.sNo || row.studentId}>
                          <tr
                            style={{ transition: 'background-color 0.12s ease' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                          >
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                                onClick={() => toggleRowExpand(row.sNo)}
                                title={isExpanded ? 'Hide breakdown' : 'View breakdown'}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {row.sNo}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {row.studentName}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                              {row.admissionNumber || '—'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>
                              {formatCurrency(row.totalAmount)}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#047857', fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>
                              {formatCurrency(row.paidAmount)}
                            </td>
                            <td
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'right',
                                fontWeight: 600,
                                color: (row.outstandingAmount || 0) > 0 ? '#b91c1c' : '#047857',
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: '0.85rem',
                              }}
                            >
                              {formatCurrency(row.outstandingAmount)}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              {renderStudentStatusBadge(row.status)}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                {/* Record Payment */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  style={{
                                    padding: '0.2rem 0.55rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: (row.outstandingAmount || 0) > 0 ? '#047857' : 'var(--text-muted)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                  }}
                                  disabled={!row.feeId || (row.outstandingAmount || 0) <= 0}
                                  onClick={() => openPaymentModal(row)}
                                  title="Record Payment"
                                >
                                  <CreditCard size={12} /> Pay
                                </button>

                                {/* Payment History */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                  }}
                                  onClick={() => openHistoryModal(row)}
                                  title="Payment History"
                                >
                                  <History size={12} />
                                </button>

                                {/* Edit Billing */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--primary)',
                                  }}
                                  onClick={() => {
                                    setIndividualModalStudent(row);
                                    setIsIndividualModalOpen(true);
                                  }}
                                  title="Edit Fee Structure"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Breakdown Drawer */}
                          {isExpanded && (
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                              <td colSpan="9" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '0.75rem',
                                    backgroundColor: '#ffffff',
                                    padding: '0.85rem 1.25rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-subtle)',
                                  }}
                                >
                                  <div>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                      Term 1
                                    </span>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(row.termFees1)}</div>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                      Term 2
                                    </span>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(row.termFees2)}</div>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                      Term 3
                                    </span>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(row.termFees3)}</div>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                      Bus Fee
                                    </span>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(row.busFees)}</div>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                      Exam Fee
                                    </span>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(row.examFees)}</div>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                      Recorded Receipts
                                    </span>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>
                                      {row.payments?.length || 0} transaction(s)
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Page {currentPage} of {totalPages} ({filteredBillingRows.length} total students)
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Bulk Upload Modal */}
      <BulkBillingUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedClass={bulkModalClass || selectedClass}
        onSuccess={() => {
          loadClassSummaries();
          if (selectedClass) loadStudentBillingForClass(selectedClass);
          loadRecentPayments();
        }}
      />

      {/* Individual Billing Modal */}
      <IndividualBillingModal
        isOpen={isIndividualModalOpen}
        onClose={() => setIsIndividualModalOpen(false)}
        selectedClass={selectedClass || (distinctClasses[0] || 'Class 10')}
        activeStudents={activeStudentsInClass}
        existingBillingRows={studentBillingRows}
        initialStudent={individualModalStudent}
        onSuccess={() => {
          loadClassSummaries();
          if (selectedClass) loadStudentBillingForClass(selectedClass);
          loadRecentPayments();
        }}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Record Payment"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPaymentModal(false)}>
              Cancel
            </button>
            <button type="submit" form="recordPaymentForm" className="btn btn-primary">
              Save Payment
            </button>
          </>
        }
      >
        <form id="recordPaymentForm" onSubmit={handleRecordPaymentSubmit}>
          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {selectedFeeForPayment?.studentName}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Class: {selectedFeeForPayment?.className} | Adm No: {selectedFeeForPayment?.admissionNumber || '—'}
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.825rem', fontWeight: 600, color: '#b91c1c' }}>
              Current Outstanding: {formatCurrency(selectedFeeForPayment?.outstandingAmount)}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Payment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={selectedFeeForPayment?.outstandingAmount || 999999}
              className="form-control"
              required
              value={paymentForm.amountPaid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                className="form-control"
                required
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-control"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              >
                <option value="ONLINE">Online / UPI</option>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note / Receipt Reference</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Receipt #1042 / UPI Transaction ID"
              value={paymentForm.note}
              onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        isOpen={historyModal}
        onClose={() => setHistoryModal(false)}
        title="Payment History"
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setHistoryModal(false)}>
            Close
          </button>
        }
      >
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            {historyFee?.studentName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Class: {historyFee?.className} | Billed: {formatCurrency(historyFee?.totalAmount)} | Paid: {formatCurrency(historyFee?.paidAmount)}
          </div>
        </div>

        {loadingHistory ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Loading payments...</p>
        ) : paymentsList.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No payment transactions recorded for this student.</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ fontSize: '0.825rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {paymentsList.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td style={{ fontWeight: 600, color: '#047857' }}>{formatCurrency(p.amountPaid)}</td>
                    <td><span className="badge badge-primary">{p.paymentMethod || 'ONLINE'}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};
