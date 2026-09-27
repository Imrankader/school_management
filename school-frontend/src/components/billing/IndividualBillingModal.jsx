import React, { useState, useEffect } from 'react';
import { feeService } from '../../services/feeService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { DollarSign, UserCheck, Calculator, X, CheckCircle2, ShieldCheck } from 'lucide-react';

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

  const [studentList, setStudentList] = useState(activeStudents);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [termFees1, setTermFees1] = useState('');
  const [termFees2, setTermFees2] = useState('');
  const [termFees3, setTermFees3] = useState('');
  const [busFees, setBusFees] = useState('');
  const [examFees, setExamFees] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [description, setDescription] = useState('Tuition & Fees');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  // Load fresh active students if in Add mode and list is empty or modal opens
  useEffect(() => {
    if (!isOpen) return;

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
    setTermFees1('');
    setTermFees2('');
    setTermFees3('');
    setBusFees('');
    setExamFees('');
    setPaidAmount('');
  };

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
    }
  };

  const handleStudentSelect = (e) => {
    const sid = e.target.value;
    setSelectedStudentId(sid);
    populateFromStudentId(sid);
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

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId && !initialStudent) {
      addToast('Please select an active student.', 'error');
      return;
    }

    if (t1 < 0 || t2 < 0 || t3 < 0 || bus < 0 || exam < 0 || paid < 0) {
      addToast('Fee amounts cannot be negative.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        studentId: Number(selectedStudentId || initialStudent?.studentId || initialStudent?.id),
        studentName: studentDisplayName,
        admissionNumber: studentDisplayAdmission !== '—' ? studentDisplayAdmission : '',
        className: studentDisplayClass !== '—' ? studentDisplayClass : selectedClass,
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

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to save billing record.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '620px', width: '95%' }}
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
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isEditMode ? '#eff6ff' : 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <DollarSign size={20} />
            </div>
            <div>
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
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
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

            {/* Fee Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Term Fees - 1 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={termFees1}
                  onChange={(e) => setTermFees1(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Term Fees - 2 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={termFees2}
                  onChange={(e) => setTermFees2(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Term Fees - 3 (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={termFees3}
                  onChange={(e) => setTermFees3(e.target.value)}
                />
              </div>
            </div>

            {/* Bus Fees & Exam Fees */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Bus Fees (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={busFees}
                  onChange={(e) => setBusFees(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Exam Fees (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={examFees}
                  onChange={(e) => setExamFees(e.target.value)}
                />
              </div>
            </div>

            {/* Paid Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Paid Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>

            {/* Calculated Summary Box (Read-Only Real-Time Display) */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Amount (Auto)
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatCurrency(totalAmount)}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Paid Amount
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                  {formatCurrency(paid)}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Outstanding (Auto)
                </div>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: outstandingAmount > 0 ? '#dc2626' : '#16a34a',
                    marginTop: '2px',
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
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
