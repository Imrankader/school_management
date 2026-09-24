import React, { useState, useEffect } from 'react';
import { feeService } from '../../services/feeService';
import { useToast } from '../../context/ToastContext';
import { DollarSign, UserCheck, Calculator, X } from 'lucide-react';

export const IndividualBillingModal = ({
  isOpen,
  onClose,
  selectedClass,
  activeStudents = [],
  existingBillingRows = [],
  initialStudent = null,
  onSuccess,
}) => {
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

  useEffect(() => {
    if (initialStudent) {
      setSelectedStudentId(initialStudent.studentId || initialStudent.id);
      populateExisting(initialStudent.studentId || initialStudent.id);
    } else if (activeStudents.length > 0) {
      setSelectedStudentId(activeStudents[0].id);
      populateExisting(activeStudents[0].id);
    }
  }, [isOpen, initialStudent, activeStudents]);

  const populateExisting = (studentId) => {
    const existing = existingBillingRows.find((r) => r.studentId === Number(studentId));
    if (existing && existing.feeId) {
      setTermFees1(existing.termFees1 || '');
      setTermFees2(existing.termFees2 || '');
      setTermFees3(existing.termFees3 || '');
      setBusFees(existing.busFees || '');
      setExamFees(existing.examFees || '');
      setPaidAmount(existing.paidAmount || '');
    } else {
      setTermFees1('');
      setTermFees2('');
      setTermFees3('');
      setBusFees('');
      setExamFees('');
      setPaidAmount('');
    }
  };

  const handleStudentSelect = (e) => {
    const sid = e.target.value;
    setSelectedStudentId(sid);
    populateExisting(sid);
  };

  // Real-time calculations
  const t1 = parseFloat(termFees1) || 0;
  const t2 = parseFloat(termFees2) || 0;
  const t3 = parseFloat(termFees3) || 0;
  const bus = parseFloat(busFees) || 0;
  const exam = parseFloat(examFees) || 0;
  const paid = parseFloat(paidAmount) || 0;

  const totalAmount = t1 + t2 + t3 + bus + exam;
  const outstandingAmount = Math.max(0, totalAmount - paid);

  const selectedStudentObj = activeStudents.find((s) => s.id === Number(selectedStudentId));

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      addToast('Please select an active student.', 'error');
      return;
    }

    if (t1 < 0 || t2 < 0 || t3 < 0 || bus < 0 || exam < 0 || paid < 0) {
      addToast('Fee amounts cannot be negative.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await feeService.createFee({
        studentId: Number(selectedStudentId),
        studentName: selectedStudentObj?.name || '',
        admissionNumber: selectedStudentObj?.admissionNumber || '',
        className: selectedClass,
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
      });

      addToast(`Billing record saved for ${selectedStudentObj?.name || 'student'}!`, 'success');
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
                background: 'var(--primary-light)',
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
                Add Billing for Individual
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Target Class: <strong style={{ color: 'var(--primary)' }}>{selectedClass}</strong>
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
            {/* Student Selection */}
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
                {activeStudents.length === 0 ? (
                  <option value="">No active students found in {selectedClass}</option>
                ) : (
                  activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admissionNumber || `ID: ${s.id}`}) — Active
                    </option>
                  ))
                )}
              </select>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Only active students currently enrolled in {selectedClass} are listed.
              </div>
            </div>

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

            {/* Calculated Summary Box */}
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
                  Total Amount
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
                  Outstanding
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
              disabled={submitting || !selectedStudentId}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <DollarSign size={16} /> Save Billing Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
