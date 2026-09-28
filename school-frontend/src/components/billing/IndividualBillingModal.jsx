import React, { useState, useEffect } from 'react';
import { feeService } from '../../services/feeService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
<<<<<<< HEAD
import { DollarSign, UserCheck, Calculator, X, CheckCircle2, ShieldCheck } from 'lucide-react';
=======
import { DollarSign, X } from 'lucide-react';
>>>>>>> 2703f6f (student and billing chnages)

export const IndividualBillingModal = ({
  isOpen,
  onClose,
  selectedClass,
  activeStudents = [],
  existingBillingRows = [],
  initialStudent = null,
  onSuccess,
}) => {
  const isEditMode = Boolean(initialStudent);

<<<<<<< HEAD
  const [studentList, setStudentList] = useState(activeStudents);
=======
>>>>>>> 2703f6f (student and billing chnages)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [feeId, setFeeId] = useState(null);
  const [termFees1, setTermFees1] = useState('');
  const [termFees2, setTermFees2] = useState('');
  const [termFees3, setTermFees3] = useState('');
  const [busFees, setBusFees] = useState('');
  const [examFees, setExamFees] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [description, setDescription] = useState('Tuition & Fees');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  // Load fresh active students if in Add mode and list is empty or modal opens
  useEffect(() => {
    if (!isOpen) return;

<<<<<<< HEAD
    if (isEditMode && initialStudent) {
      const sid = initialStudent.studentId || initialStudent.id;
      setSelectedStudentId(sid);
      populateFromStudent(initialStudent);
    } else {
      // In Add mode, fetch active students to ensure newly created students are present
      const loadStudents = async () => {
        try {
          let list = [];
          if (selectedClass && selectedClass !== 'ALL' && selectedClass !== 'All Classes') {
            const res = await studentService.getActiveStudentsByClass(selectedClass);
            list = res.data || res || [];
          } else {
            const res = await studentService.getAllStudents();
            const all = res.data || res || [];
            list = all.filter((s) => !Boolean(s.isActive === false));
          }
          setStudentList(list);
          if (list.length > 0) {
            setSelectedStudentId(list[0].id);
            populateFromStudentId(list[0].id, list);
          } else {
            setSelectedStudentId('');
            clearFees();
          }
        } catch (err) {
          console.warn('Failed to load latest active students:', err);
          setStudentList(activeStudents);
          if (activeStudents.length > 0) {
            setSelectedStudentId(activeStudents[0].id);
            populateFromStudentId(activeStudents[0].id, activeStudents);
          }
        }
      };

      loadStudents();
    }
  }, [isOpen, initialStudent, selectedClass]);

  const clearFees = () => {
=======
    if (initialStudent) {
      const sid = String(initialStudent.studentId || initialStudent.id);
      setSelectedStudentId(sid);
      if (initialStudent.feeId) {
        setFeeId(initialStudent.feeId);
      }
      loadStudentBillingData(sid, initialStudent);
    } else {
      setSelectedStudentId('');
      setFeeId(null);
      resetFields();
    }
  }, [isOpen, initialStudent]);

  const resetFields = () => {
    setFeeId(null);
>>>>>>> 2703f6f (student and billing chnages)
    setTermFees1('');
    setTermFees2('');
    setTermFees3('');
    setBusFees('');
    setExamFees('');
    setPaidAmount('');
  };

<<<<<<< HEAD
  const populateFromStudent = (stud) => {
    if (!stud) return;
    setTermFees1(stud.termFees1 !== null && stud.termFees1 !== undefined ? String(stud.termFees1) : '');
    setTermFees2(stud.termFees2 !== null && stud.termFees2 !== undefined ? String(stud.termFees2) : '');
    setTermFees3(stud.termFees3 !== null && stud.termFees3 !== undefined ? String(stud.termFees3) : '');
    setBusFees(stud.busFees !== null && stud.busFees !== undefined ? String(stud.busFees) : '');
    setExamFees(stud.examFees !== null && stud.examFees !== undefined ? String(stud.examFees) : '');
    setPaidAmount(stud.paidAmount !== null && stud.paidAmount !== undefined ? String(stud.paidAmount) : '');
  };

  const populateFromStudentId = (sid, list = studentList) => {
    const existing = existingBillingRows.find((r) => r.studentId === Number(sid));
    if (existing && (existing.feeId || existing.totalAmount !== undefined)) {
      populateFromStudent(existing);
    } else {
      clearFees();
=======
  const loadStudentBillingData = async (studentId, initialData = null) => {
    if (!studentId) {
      resetFields();
      return;
    }

    // If initialData provided in Edit mode has fee breakdown pre-populated
    if (initialData && (initialData.termFees1 !== undefined || initialData.feeId)) {
      if (initialData.feeId) setFeeId(initialData.feeId);
      setTermFees1(initialData.termFees1 != null ? String(initialData.termFees1) : '');
      setTermFees2(initialData.termFees2 != null ? String(initialData.termFees2) : '');
      setTermFees3(initialData.termFees3 != null ? String(initialData.termFees3) : '');
      setBusFees(initialData.busFees != null ? String(initialData.busFees) : '');
      setExamFees(initialData.examFees != null ? String(initialData.examFees) : '');
      setPaidAmount(initialData.paidAmount != null ? String(initialData.paidAmount) : '');
      return;
    }

    // 1. Check existingBillingRows if provided
    const existingInProps = existingBillingRows.find(
      (r) => String(r.studentId) === String(studentId)
    );

    if (existingInProps && (existingInProps.feeId || existingInProps.totalAmount !== undefined)) {
      if (existingInProps.feeId) setFeeId(existingInProps.feeId);
      setTermFees1(existingInProps.termFees1 != null ? String(existingInProps.termFees1) : '');
      setTermFees2(existingInProps.termFees2 != null ? String(existingInProps.termFees2) : '');
      setTermFees3(existingInProps.termFees3 != null ? String(existingInProps.termFees3) : '');
      setBusFees(existingInProps.busFees != null ? String(existingInProps.busFees) : '');
      setExamFees(existingInProps.examFees != null ? String(existingInProps.examFees) : '');
      setPaidAmount(existingInProps.paidAmount != null ? String(existingInProps.paidAmount) : '');
      return;
    }

    // 2. Fetch directly from backend to ensure latest existing billing values
    try {
      setLoadingExisting(true);
      const res = await feeService.getFeesByStudent(studentId);
      const feesList = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(feesList) && feesList.length > 0) {
        const fee = feesList[0];
        if (fee.id) setFeeId(fee.id);
        setTermFees1(fee.termFees1 != null ? String(fee.termFees1) : '');
        setTermFees2(fee.termFees2 != null ? String(fee.termFees2) : '');
        setTermFees3(fee.termFees3 != null ? String(fee.termFees3) : '');
        setBusFees(fee.busFees != null ? String(fee.busFees) : '');
        setExamFees(fee.examFees != null ? String(fee.examFees) : '');
        setPaidAmount(fee.paidAmount != null ? String(fee.paidAmount) : '');
      } else {
        resetFields();
      }
    } catch (err) {
      resetFields();
    } finally {
      setLoadingExisting(false);
>>>>>>> 2703f6f (student and billing chnages)
    }
  };

  const handleStudentSelect = (e) => {
    const sid = e.target.value;
    setSelectedStudentId(sid);
<<<<<<< HEAD
    populateFromStudentId(sid);
=======
    loadStudentBillingData(sid);
>>>>>>> 2703f6f (student and billing chnages)
  };

  // Real-time automatic calculations
  const t1 = parseFloat(termFees1) || 0;
  const t2 = parseFloat(termFees2) || 0;
  const t3 = parseFloat(termFees3) || 0;
  const bus = parseFloat(busFees) || 0;
  const exam = parseFloat(examFees) || 0;
  const paid = parseFloat(paidAmount) || 0;

  // Total Amount = Term Fee 1 + Term Fee 2 + Term Fee 3 + Bus Fee + Exam Fee
  const totalAmount = t1 + t2 + t3 + bus + exam;

  // Outstanding = Total Amount - Paid Amount
  const outstandingAmount = Math.max(0, totalAmount - paid);

<<<<<<< HEAD
  // Active student object lookup
  const selectedStudentObj = isEditMode
    ? initialStudent
    : studentList.find((s) => s.id === Number(selectedStudentId)) ||
      activeStudents.find((s) => s.id === Number(selectedStudentId));

  const studentDisplayName =
    selectedStudentObj?.studentName ||
    selectedStudentObj?.name ||
    'Student';

  const studentDisplayAdmission =
    selectedStudentObj?.admissionNumber || '—';

  const studentDisplayClass =
    selectedStudentObj?.className || selectedClass || '—';
=======
  // Determine current active student details
  const editStudentInfo = isEditMode
    ? {
        id: initialStudent.studentId || initialStudent.id,
        name: initialStudent.studentName || initialStudent.name || '',
        admissionNumber: initialStudent.admissionNumber || '',
        className: initialStudent.className || selectedClass || '',
      }
    : null;

  const selectedStudentObj = !isEditMode
    ? activeStudents.find((s) => String(s.id) === String(selectedStudentId))
    : editStudentInfo;

  const currentStudent = isEditMode ? editStudentInfo : selectedStudentObj;
>>>>>>> 2703f6f (student and billing chnages)

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    if (!selectedStudentId && !initialStudent) {
      addToast('Please select an active student.', 'error');
=======

    const targetStudentId = isEditMode
      ? (initialStudent.studentId || initialStudent.id)
      : Number(selectedStudentId);

    if (!targetStudentId || (!isEditMode && !selectedStudentObj)) {
      addToast('Please select a valid active student from the Student Portal.', 'error');
>>>>>>> 2703f6f (student and billing chnages)
      return;
    }

    if (t1 < 0 || t2 < 0 || t3 < 0 || bus < 0 || exam < 0 || paid < 0) {
      addToast('Fee amounts cannot be negative.', 'error');
      return;
    }

    setSubmitting(true);
    try {
<<<<<<< HEAD
      const payload = {
        studentId: Number(selectedStudentId || initialStudent?.studentId || initialStudent?.id),
        studentName: studentDisplayName,
        admissionNumber: studentDisplayAdmission !== '—' ? studentDisplayAdmission : '',
        className: studentDisplayClass !== '—' ? studentDisplayClass : selectedClass,
=======
      const studentClass = currentStudent?.className || selectedClass || 'Class 10';
      await feeService.createFee({
        id: feeId || undefined,
        studentId: Number(targetStudentId),
        studentName: currentStudent?.name || '',
        admissionNumber: currentStudent?.admissionNumber || '',
        className: studentClass,
>>>>>>> 2703f6f (student and billing chnages)
        termFees1: t1,
        termFees2: t2,
        termFees3: t3,
        busFees: bus,
        examFees: exam,
        totalAmount: totalAmount,
        paidAmount: paid,
        pendingAmount: outstandingAmount,
        description,
        academicYear,
      };

      if (isEditMode && initialStudent?.feeId) {
        await feeService.updateFee(initialStudent.feeId, payload);
        addToast(`Billing updated successfully for ${studentDisplayName}!`, 'success');
      } else {
        await feeService.createFee(payload);
        addToast(
          isEditMode
            ? `Billing updated successfully for ${studentDisplayName}!`
            : `Billing record saved for ${studentDisplayName}!`,
          'success'
        );
      }

<<<<<<< HEAD
=======
      addToast(
        isEditMode
          ? `Billing record updated successfully for ${currentStudent?.name || 'student'} (${studentClass})!`
          : `Billing record saved successfully for ${currentStudent?.name || 'student'} (${studentClass})!`,
        'success'
      );
>>>>>>> 2703f6f (student and billing chnages)
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Failed to save billing record.';
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '640px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-medium, #e2e8f0)',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
<<<<<<< HEAD
                background: isEditMode ? '#eff6ff' : 'var(--primary-light)',
=======
                background: 'var(--primary-light, #e0e7ff)',
>>>>>>> 2703f6f (student and billing chnages)
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary, #4f46e5)',
              }}
            >
              <DollarSign size={20} />
            </div>
            <div>
<<<<<<< HEAD
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                {isEditMode ? `Edit Student Billing` : `Add Individual Billing`}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isEditMode ? (
                  <span>
                    Student: <strong style={{ color: 'var(--text-main)' }}>{studentDisplayName}</strong> • Class: <strong style={{ color: 'var(--primary)' }}>{studentDisplayClass}</strong>
                  </span>
                ) : (
                  <span>
                    Target Class: <strong style={{ color: 'var(--primary)' }}>{selectedClass}</strong>
                  </span>
                )}
=======
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                {isEditMode ? 'Edit Billing' : 'Add Billing for Individual'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                {isEditMode
                  ? 'Update billing details for this student.'
                  : 'Create billing record for an active student across all classes.'}
>>>>>>> 2703f6f (student and billing chnages)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
<<<<<<< HEAD
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Student Identity Card / Selection */}
            {isEditMode ? (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Student Identity (Locked)
                </label>
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      {studentDisplayName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Admission No: <strong style={{ color: 'var(--text-main)' }}>{studentDisplayAdmission}</strong> • Class: <strong style={{ color: 'var(--primary)' }}>{studentDisplayClass}</strong>
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <ShieldCheck size={14} /> Identity Verified
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Select Active Student <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={selectedStudentId}
                  onChange={handleStudentSelect}
                  required
                  style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                >
                  {studentList.length === 0 ? (
                    <option value="">No active students found in {selectedClass}</option>
                  ) : (
                    studentList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.admissionNumber || `ID: ${s.id}`}) — {s.className || selectedClass}
                      </option>
                    ))
                  )}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Newly enrolled students from Student Management are immediately available.
                </div>
              </div>
            )}
=======
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            className="modal-body"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem',
              overflowY: 'auto',
              maxHeight: 'calc(92vh - 145px)',
            }}
          >
            {/* ========================================================================= */}
            {/* STUDENT SECTION: EDIT MODE (READ-ONLY CARD) vs ADD MODE (DROPDOWN) */}
            {/* ========================================================================= */}
            {isEditMode ? (
              /* Read-only Student Information Card (No select, no dropdown arrow, not clickable) */
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '1rem 1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Student
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
                    {currentStudent?.name || '—'}
                  </div>
                </div>
>>>>>>> 2703f6f (student and billing chnages)

                <div style={{ borderLeft: '1px solid var(--border-medium, #e2e8f0)', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Admission No
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
                    {currentStudent?.admissionNumber || '—'}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-medium, #e2e8f0)', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Class
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: 'var(--primary-light, #e0e7ff)',
                        color: 'var(--primary, #4338ca)',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {currentStudent?.className || selectedClass || 'Class N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Add Mode: Active Student Dropdown Selector */
              <div>
                <div className="form-group" style={{ marginBottom: selectedStudentObj ? '0.75rem' : 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                    Select Active Student <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
                  </label>
                  <select
                    className="form-select"
                    value={selectedStudentId}
                    onChange={handleStudentSelect}
                    required
                    disabled={submitting}
                    style={{
                      height: '42px',
                      fontSize: '0.925rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled>Select active student</option>
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.admissionNumber || `ID: ${s.id}`}) — {s.className || 'Class N/A'}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.35rem' }}>
                    Only active students are listed.
                  </div>
                </div>

                {/* Selected Student Details Card in Add Mode */}
                {selectedStudentObj && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1px solid var(--border-medium, #e2e8f0)',
                      fontSize: '0.85rem',
                      color: 'var(--text-main, #1e293b)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Student: </span>
                      <strong>{selectedStudentObj.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Admission No: </span>
                      <strong>{selectedStudentObj.admissionNumber || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Class: </span>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: 'var(--primary-light, #e0e7ff)',
                          color: 'var(--primary, #4338ca)',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        {selectedStudentObj.className || 'Class N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Term Fees Breakdown (3 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Term Fees - 1 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={termFees1}
                  onChange={(e) => setTermFees1(e.target.value)}
                  disabled={loadingExisting || submitting}
                  style={{ height: '40px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Term Fees - 2 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={termFees2}
                  onChange={(e) => setTermFees2(e.target.value)}
                  disabled={loadingExisting || submitting}
                  style={{ height: '40px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Term Fees - 3 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={termFees3}
                  onChange={(e) => setTermFees3(e.target.value)}
                  disabled={loadingExisting || submitting}
                  style={{ height: '40px' }}
                />
              </div>
            </div>

            {/* Bus Fees & Exam Fees (2 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Bus Fees (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={busFees}
                  onChange={(e) => setBusFees(e.target.value)}
                  disabled={loadingExisting || submitting}
                  style={{ height: '40px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Exam Fees (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={examFees}
                  onChange={(e) => setExamFees(e.target.value)}
                  disabled={loadingExisting || submitting}
                  style={{ height: '40px' }}
                />
              </div>
            </div>

            {/* Paid Amount */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Paid Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                disabled={loadingExisting || submitting}
                style={{ height: '40px' }}
              />
            </div>

<<<<<<< HEAD
            {/* Calculated Summary Box (Read-Only Real-Time Display) */}
=======
            {/* Calculated Financial Summary Cards */}
>>>>>>> 2703f6f (student and billing chnages)
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-medium, #e2e8f0)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '1rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
              }}
            >
              <div>
<<<<<<< HEAD
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Amount (Auto)
=======
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  TOTAL AMOUNT
>>>>>>> 2703f6f (student and billing chnages)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginTop: '4px' }}>
                  {formatCurrency(totalAmount)}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border-medium, #e2e8f0)', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  PAID AMOUNT
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                  {formatCurrency(paid)}
                </div>
              </div>

<<<<<<< HEAD
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Outstanding (Auto)
=======
              <div style={{ borderLeft: '1px solid var(--border-medium, #e2e8f0)', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  OUTSTANDING
>>>>>>> 2703f6f (student and billing chnages)
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: outstandingAmount > 0 ? '#dc2626' : '#16a34a',
                    marginTop: '4px',
                  }}
                >
                  {formatCurrency(outstandingAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="modal-footer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-medium, #e2e8f0)',
              backgroundColor: '#ffffff',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.875rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
<<<<<<< HEAD
              disabled={submitting || (!selectedStudentId && !initialStudent)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isEditMode ? (
                <>
                  <CheckCircle2 size={16} /> Update Billing
                </>
              ) : (
                <>
                  <DollarSign size={16} /> Save Billing Record
                </>
              )}
=======
              disabled={submitting || (!isEditMode && !selectedStudentId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <DollarSign size={16} /> {isEditMode ? 'Update Billing Record' : 'Save Billing Record'}
>>>>>>> 2703f6f (student and billing chnages)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
