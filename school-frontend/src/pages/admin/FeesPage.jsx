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
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Users
} from 'lucide-react';

export const FeesPage = () => {
  // Navigation / View State: 'classes' | 'class-details'
  const [view, setView] = useState('classes');
  const [selectedClass, setSelectedClass] = useState('');

  // Class Summary Data
  const [classSummaries, setClassSummaries] = useState([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  // Student Billing Data for Selected Class
  const [studentBillingRows, setStudentBillingRows] = useState([]);
  const [activeStudentsInClass, setActiveStudentsInClass] = useState([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);

  // Search & Filter within Class
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Expanded Row IDs (for Screenshot 2 behavior)
  const [expandedRows, setExpandedRows] = useState({});

  // Pagination for Selected Class Student Billing
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modals
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
  const [individualModalStudent, setIndividualModalStudent] = useState(null);

  // Record Payment Modal (Preserved feature)
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'ONLINE',
    note: '',
  });

  // Payment History Modal (Preserved feature)
  const [historyModal, setHistoryModal] = useState(false);
  const [historyFee, setHistoryFee] = useState(null);
  const [paymentsList, setPaymentsList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadClassSummaries();
  }, []);

  const loadClassSummaries = async () => {
    try {
      setLoadingSummaries(true);
      const res = await feeService.getClassBillingSummary();
      if (res.success && res.data) {
        setClassSummaries(res.data);
      } else {
        setClassSummaries([]);
      }
    } catch (err) {
      console.error('Failed to load class billing summaries:', err);
      addToast('Failed to load class-wise billing summaries.', 'error');
    } finally {
      setLoadingSummaries(false);
    }
  };

  const loadStudentBillingForClass = async (className) => {
    try {
      setLoadingClassStudents(true);
      setSearchTerm('');
      setStatusFilter('All');
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
      addToast(`Failed to load student billing records for ${className}.`, 'error');
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
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Status Badge Renderer matching Screenshot 2 visual style
  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'settled' || s === 'paid') {
      return (
        <span
          style={{
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
            borderRadius: '9999px',
            padding: '0.2rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'lowercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          settled
        </span>
      );
    }
    if (s === 'partially paid' || s === 'partial') {
      return (
        <span
          style={{
            backgroundColor: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
            borderRadius: '9999px',
            padding: '0.2rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'lowercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          partially paid
        </span>
      );
    }
    if (s === 'pending' || s === 'outstanding') {
      return (
        <span
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: '9999px',
            padding: '0.2rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'lowercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          outstanding
        </span>
      );
    }
    return (
      <span
        style={{
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          border: '1px solid #e2e8f0',
          borderRadius: '9999px',
          padding: '0.2rem 0.65rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'lowercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        unbilled
      </span>
    );
  };

  // Filtered & Paginated Student Billing Rows
  const filteredBillingRows = useMemo(() => {
    return studentBillingRows.filter((row) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        (row.studentName && row.studentName.toLowerCase().includes(q)) ||
        (row.admissionNumber && row.admissionNumber.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Settled' && (row.status === 'settled' || row.status === 'PAID')) ||
        (statusFilter === 'Partially Paid' && (row.status === 'partially paid' || row.status === 'PARTIAL')) ||
        (statusFilter === 'Pending' && (row.status === 'pending' || row.status === 'PENDING')) ||
        (statusFilter === 'Unbilled' && row.status === 'unbilled');

      return matchSearch && matchStatus;
    });
  }, [studentBillingRows, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredBillingRows.length / pageSize) || 1;
  const paginatedBillingRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBillingRows.slice(start, start + pageSize);
  }, [filteredBillingRows, currentPage]);

  // Overall Global Aggregates for Summary Cards
  const globalMetrics = useMemo(() => {
    const totalStudents = classSummaries.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
    const totalAmount = classSummaries.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const totalPaid = classSummaries.reduce((sum, c) => sum + (c.totalPaidAmount || 0), 0);
    const totalOutstanding = classSummaries.reduce((sum, c) => sum + (c.totalOutstandingAmount || 0), 0);
    return { totalStudents, totalAmount, totalPaid, totalOutstanding };
  }, [classSummaries]);

  // Selected Class Aggregates
  const classMetrics = useMemo(() => {
    const count = studentBillingRows.length;
    const billed = studentBillingRows.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const paid = studentBillingRows.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const outstanding = studentBillingRows.reduce((sum, r) => sum + (r.outstandingAmount || 0), 0);
    return { count, billed, paid, outstanding };
  }, [studentBillingRows]);

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
      if (res.success && res.data) {
        setPaymentsList(res.data);
      } else {
        setPaymentsList([]);
      }
    } catch (err) {
      setPaymentsList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '1.5rem 2rem' }}>
      {/* ========================================================================= */}
      {/* 1. CLASS SUMMARY VIEW (MAIN VIEW) */}
      {/* ========================================================================= */}
      {view === 'classes' && (
        <div>
          {/* Header */}
          <div
            className="page-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>Billing</span>
                <span>/</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Class Summary</span>
              </div>
              <h1
                className="page-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                <DollarSign className="text-primary" /> Billing Portal
              </h1>
              <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                Class-level overview of fee generation, collections, and outstanding dues.
              </p>
            </div>
          </div>

          {/* Top Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.75rem',
            }}
          >
            <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #4f46e5' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Active Students
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#4f46e5', marginTop: '0.25rem' }}>
                {globalMetrics.totalStudents}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Across {classSummaries.length} classes
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #0ea5e9' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Billed Amount
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0ea5e9', marginTop: '0.25rem' }}>
                {formatCurrency(globalMetrics.totalAmount)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Consolidated fee invoices
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Paid Amount
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>
                {formatCurrency(globalMetrics.totalPaid)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Settled receipts
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Outstanding
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>
                {formatCurrency(globalMetrics.totalOutstanding)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Pending collection dues
              </div>
            </div>
          </div>

          {/* Class Summary Main Table (Screenshot 1 Reference) */}
          <div className="card" style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div
              style={{
                padding: '1.1rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} className="text-primary" /> Class-Wise Billing Summary
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Click on any class row or <strong>View →</strong> to view student details
              </div>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                  <tr>
                    <th style={{ padding: '0.85rem 1rem', width: '70px', textAlign: 'center' }}>S.No</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Class</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Total Students</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total Amount</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total Paid Amount</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total Outstanding Amount</th>
                    <th style={{ padding: '0.85rem 1rem', width: '120px', textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSummaries ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Loading class-wise billing summaries...
                      </td>
                    </tr>
                  ) : classSummaries.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No configured classes found in Academic / Student records.
                      </td>
                    </tr>
                  ) : (
                    classSummaries.map((item) => (
                      <tr
                        key={item.className}
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onClick={() => handleOpenClassDetails(item.className)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                      >
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {item.sNo}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          <span
                            style={{
                              backgroundColor: '#eef2ff',
                              color: 'var(--primary)',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                            }}
                          >
                            {item.className}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                          {item.totalStudents}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                          {formatCurrency(item.totalPaidAmount)}
                        </td>
                        <td
                          style={{
                            padding: '0.85rem 1rem',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: item.totalOutstandingAmount > 0 ? '#dc2626' : '#16a34a',
                          }}
                        >
                          {formatCurrency(item.totalOutstandingAmount)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              padding: '0.3rem 0.75rem',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontWeight: 600,
                              color: 'var(--primary)',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenClassDetails(item.className);
                            }}
                          >
                            View <ChevronRight size={14} />
                          </button>
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
      {/* 2. SELECTED CLASS STUDENT BILLING VIEW (SCREENSHOT 1 & SCREENSHOT 2) */}
      {/* ========================================================================= */}
      {view === 'class-details' && (
        <div>
          {/* Breadcrumb & Top Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={handleBackToClasses}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Billing
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={handleBackToClasses}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Class Summary
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={handleBackToClasses}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <ArrowLeft size={16} /> Back to Summary
                </button>
                <div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: 0 }}>
                    {selectedClass} Student Billing
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '2px 0 0' }}>
                    Active enrolled students in {selectedClass} and detailed fee breakdown.
                  </p>
                </div>
              </div>

              {/* Requirement 8: Bulk Upload & Add Billing for Individual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    padding: '0.55rem 1.15rem',
                  }}
                >
                  <Upload size={17} /> Bulk Upload
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
                    gap: '0.5rem',
                    fontWeight: 600,
                    padding: '0.55rem 1.15rem',
                  }}
                >
                  <Plus size={17} /> Add Billing for Individual
                </button>
              </div>
            </div>
          </div>

          {/* Selected Class Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #4f46e5' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Active Students ({selectedClass})
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {classMetrics.count}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #0ea5e9' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Class Total Billed
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0ea5e9', marginTop: '0.2rem' }}>
                {formatCurrency(classMetrics.billed)}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Class Total Paid
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>
                {formatCurrency(classMetrics.paid)}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Class Total Outstanding
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '0.2rem' }}>
                {formatCurrency(classMetrics.outstanding)}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar (Requirement 29) */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1.25rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={`Search by student name or admission number in ${selectedClass}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ paddingLeft: '2.4rem', borderRadius: '2rem', height: '42px', width: '100%' }}
              />
              <Search
                size={18}
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
              />
            </div>

            <div style={{ width: '180px' }}>
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ borderRadius: '2rem', height: '42px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Settled">Settled</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
                <option value="Unbilled">Unbilled</option>
              </select>
            </div>
          </div>

          {/* Detailed Student Billing Table (Screenshot 1 & Screenshot 2) */}
          <div className="card" style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0, minWidth: '1050px' }}>
                <thead style={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid var(--border-subtle)' }}>
                  <tr>
                    <th style={{ padding: '0.85rem 0.75rem', width: '55px', textAlign: 'center' }}>S.No</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>Student Name</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>Class</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>Term Fees - 1</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>Term Fees - 2</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>Term Fees - 3</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>Bus Fees</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>Exam Fees</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>Outstanding Amount</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>Paid Amount</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>Total Amount</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center', width: '80px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingClassStudents ? (
                    <tr>
                      <td colSpan="13" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                        Fetching active student billing records for {selectedClass}...
                      </td>
                    </tr>
                  ) : paginatedBillingRows.length === 0 ? (
                    <tr>
                      <td colSpan="13" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                        No students matching your search criteria in {selectedClass}.
                      </td>
                    </tr>
                  ) : (
                    paginatedBillingRows.map((student) => {
                      const isExpanded = !!expandedRows[student.sNo];
                      return (
                        <React.Fragment key={student.studentId || student.sNo}>
                          <tr
                            style={{
                              backgroundColor: isExpanded ? '#f8fafc' : '#ffffff',
                              borderBottom: isExpanded ? 'none' : '1px solid var(--border-subtle)',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {student.sNo}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>
                              <div>{student.studentName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                {student.admissionNumber || `ID: ${student.studentId}`}
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {student.className}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                              {formatCurrency(student.termFees1)}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                              {formatCurrency(student.termFees2)}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                              {formatCurrency(student.termFees3)}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                              {formatCurrency(student.busFees)}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                              {formatCurrency(student.examFees)}
                            </td>
                            <td
                              style={{
                                padding: '0.85rem 0.75rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: student.outstandingAmount > 0 ? '#dc2626' : '#16a34a',
                              }}
                            >
                              {formatCurrency(student.outstandingAmount)}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                              {formatCurrency(student.paidAmount)}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>
                              {formatCurrency(student.totalAmount)}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                              {renderStatusBadge(student.status)}
                            </td>
                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(student.sNo)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-main)',
                                  padding: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                              >
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                              </button>
                            </td>
                          </tr>

                          {/* ========================================================================= */}
                          {/* EXPANDABLE ROW DETAILS (EXACT BEHAVIOR & DESIGN FROM SCREENSHOT 2) */}
                          {/* ========================================================================= */}
                          {isExpanded && (
                            <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-subtle)' }}>
                              <td colSpan="13" style={{ padding: '0.75rem 1.5rem 1.5rem' }}>
                                <div
                                  style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  }}
                                >
                                  {/* Sub-header title */}
                                  <div
                                    style={{
                                      padding: '0.65rem 1rem',
                                      fontWeight: 600,
                                      fontSize: '0.9rem',
                                      color: 'var(--text-main)',
                                      backgroundColor: '#ffffff',
                                      borderBottom: '1px solid #e2e8f0',
                                    }}
                                  >
                                    Outstanding - Payers
                                  </div>

                                  {/* Subtable matching Screenshot 2 column structure */}
                                  <table className="table" style={{ margin: 0, fontSize: '0.825rem' }}>
                                    <thead style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                                      <tr>
                                        <th style={{ padding: '0.55rem 0.85rem', fontWeight: 600 }}>PAYER NAME</th>
                                        <th style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>RECEIVABLE</th>
                                        <th style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>RECEIPTED</th>
                                        <th style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>REFUND</th>
                                        <th style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>DISCOUNT</th>
                                        <th style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>OUTSTANDING AMOUNT</th>
                                        <th style={{ padding: '0.55rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>INVOICE NO.</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr style={{ backgroundColor: '#f0f9ff' }}>
                                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>
                                          Student ({student.studentName})
                                        </td>
                                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>
                                          {formatCurrency(student.totalAmount)}
                                        </td>
                                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                                          {formatCurrency(student.paidAmount)}
                                        </td>
                                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                                          ₹0.00
                                        </td>
                                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                                          ₹0.00
                                        </td>
                                        <td
                                          style={{
                                            padding: '0.65rem 0.85rem',
                                            textAlign: 'right',
                                            fontWeight: 700,
                                            color: student.outstandingAmount > 0 ? '#dc2626' : '#16a34a',
                                          }}
                                        >
                                          {formatCurrency(student.outstandingAmount)}
                                        </td>
                                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                                          {student.feeId ? `INV-${student.feeId}` : '—'}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>

                                  {/* Quick Action Buttons on Expanded Row */}
                                  <div
                                    style={{
                                      padding: '0.65rem 1rem',
                                      backgroundColor: '#ffffff',
                                      display: 'flex',
                                      justifyContent: 'flex-end',
                                      alignItems: 'center',
                                      gap: '0.75rem',
                                      borderTop: '1px solid #e2e8f0',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() => openHistoryModal(student)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        fontSize: '0.775rem',
                                        padding: '0.35rem 0.75rem',
                                      }}
                                    >
                                      <History size={14} /> Payment History
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() => {
                                        setIndividualModalStudent(student);
                                        setIsIndividualModalOpen(true);
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        fontSize: '0.775rem',
                                        padding: '0.35rem 0.75rem',
                                      }}
                                    >
                                      <DollarSign size={14} /> Edit Billing Breakdown
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() => openPaymentModal(student)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        fontSize: '0.775rem',
                                        padding: '0.35rem 0.75rem',
                                      }}
                                    >
                                      <CreditCard size={14} /> Record Payment
                                    </button>
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

            {/* Pagination (Requirement 30) */}
            <div
              style={{
                padding: '0.9rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing{' '}
                <strong>
                  {filteredBillingRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>
                –
                <strong>
                  {Math.min(currentPage * pageSize, filteredBillingRows.length)}
                </strong>{' '}
                of <strong>{filteredBillingRows.length}</strong> active students
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0.4rem' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALS */}
      {/* ========================================================================= */}
      {/* Bulk Upload Modal */}
      <BulkBillingUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedClass={selectedClass}
        onSuccess={() => {
          loadStudentBillingForClass(selectedClass);
        }}
      />

      {/* Individual Billing Modal */}
      <IndividualBillingModal
        isOpen={isIndividualModalOpen}
        onClose={() => {
          setIsIndividualModalOpen(false);
          setIndividualModalStudent(null);
        }}
        selectedClass={selectedClass}
        activeStudents={activeStudentsInClass}
        existingBillingRows={studentBillingRows}
        initialStudent={individualModalStudent}
        onSuccess={() => {
          loadStudentBillingForClass(selectedClass);
        }}
      />

      {/* Record Payment Modal */}
      {paymentModal && (
        <Modal
          isOpen={paymentModal}
          onClose={() => {
            setPaymentModal(false);
            setSelectedFeeForPayment(null);
          }}
          title={`Record Payment — ${selectedFeeForPayment?.studentName || ''}`}
        >
          <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Outstanding Due:</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#dc2626' }}>
                {formatCurrency(selectedFeeForPayment?.outstandingAmount || 0)}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={selectedFeeForPayment?.outstandingAmount || 999999}
                className="form-control"
                value={paymentForm.amountPaid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Payment Date *
              </label>
              <input
                type="date"
                className="form-control"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Payment Method
              </label>
              <select
                className="form-control"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              >
                <option value="ONLINE">ONLINE (UPI / NetBanking / Card)</option>
                <option value="CASH">CASH</option>
                <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Transaction Note / Reference
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. UTR / Receipt No."
                value={paymentForm.note}
                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPaymentModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment History Modal */}
      {historyModal && (
        <Modal
          isOpen={historyModal}
          onClose={() => setHistoryModal(false)}
          title={`Payment Audit History — ${historyFee?.studentName || ''}`}
        >
          {loadingHistory ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading payments...</p>
          ) : paymentsList.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No payments recorded yet for this billing cycle.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((p) => (
                    <tr key={p.id}>
                      <td>{p.paymentDate}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#eef2ff', color: 'var(--primary)' }}>
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#16a34a' }}>
                        {formatCurrency(p.amountPaid)}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
