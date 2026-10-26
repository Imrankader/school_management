import React, { useState, useEffect, useMemo } from 'react';
import { academicService } from '../../services/academicService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { CLASS_CONFIG, toDisplayClassName } from '../../utils/academicClassOrder';
import { Award, Plus, Trash2, Edit2, Search, X, Save, RefreshCw } from 'lucide-react';

const BOARD_OPTIONS = [
  { value: 'STATE_BOARD', label: 'State Board' },
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
];

const defaultAcademicYear = () => {
  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1; // school year starts around June
  return `${startYear}-${startYear + 1}`;
};

const emptyForm = () => ({
  studentId: '',
  board: 'STATE_BOARD',
  standard: 'X',
  academicYear: defaultAcademicYear(),
  subjects: [{ subjectName: '', marks: '' }],
});

export const BoardResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allStudents, setAllStudents] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [studentQuery, setStudentQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    loadResults();
    loadStudents();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const res = await academicService.getBoardResults();
      if (res.success && res.data) setResults(res.data);
    } catch {
      addToast('Failed to load board results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await studentService.getAllStudents({ page: 1, pageSize: 10000, status: 'Active' });
      const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      setAllStudents(list);
      const map = {};
      list.forEach((s) => { map[s.id] = s; });
      setStudentsMap(map);
    } catch {
      addToast('Failed to load students', 'error');
    }
  };

  const studentMatches = useMemo(() => {
    const term = studentQuery.trim().toLowerCase();
    const list = allStudents.filter((s) => {
      const textMatch = !term ||
        (s.name || '').toLowerCase().includes(term) ||
        (s.admissionNumber || '').toLowerCase().includes(term);
      const classMatch = !classFilter || s.className === classFilter;
      return textMatch && classMatch;
    });
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '')).slice(0, 50);
  }, [studentQuery, classFilter, allStudents]);

  const selectedStudent = form.studentId ? studentsMap[form.studentId] : null;

  const totalMarks = useMemo(
    () => form.subjects.reduce((sum, s) => sum + (Number(s.marks) || 0), 0),
    [form.subjects]
  );

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setStudentQuery('');
    setClassFilter('');
  };

  const addSubjectRow = () => {
    setForm({ ...form, subjects: [...form.subjects, { subjectName: '', marks: '' }] });
  };

  const removeSubjectRow = (idx) => {
    setForm({ ...form, subjects: form.subjects.filter((_, i) => i !== idx) });
  };

  const updateSubjectRow = (idx, field, value) => {
    const subjects = form.subjects.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    setForm({ ...form, subjects });
  };

  const openEdit = (result) => {
    setEditingId(result.id);
    setForm({
      studentId: result.studentId,
      board: result.board,
      standard: result.standard,
      academicYear: result.academicYear,
      subjects: result.subjects && result.subjects.length > 0 ? result.subjects.map((s) => ({ subjectName: s.subjectName, marks: s.marks })) : [{ subjectName: '', marks: '' }],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this board result?')) return;
    try {
      await academicService.deleteBoardResult(id);
      addToast('Board result deleted', 'success');
      loadResults();
    } catch {
      addToast('Failed to delete board result', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      addToast('Please select a student', 'warning');
      return;
    }
    const cleanSubjects = form.subjects
      .filter((s) => s.subjectName.trim())
      .map((s) => ({ subjectName: s.subjectName.trim(), marks: Number(s.marks) || 0 }));
    if (cleanSubjects.length === 0) {
      addToast('Add at least one subject with marks', 'warning');
      return;
    }
    const student = studentsMap[form.studentId];
    const payload = {
      studentId: form.studentId,
      admissionNumber: student?.admissionNumber,
      studentName: student?.name,
      board: form.board,
      standard: form.standard,
      academicYear: form.academicYear.trim(),
      subjects: cleanSubjects,
    };
    try {
      setSaving(true);
      if (editingId) {
        await academicService.updateBoardResult(editingId, payload);
        addToast('Board result updated', 'success');
      } else {
        await academicService.createBoardResult(payload);
        addToast('Board result saved', 'success');
      }
      resetForm();
      loadResults();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save board result', 'error');
    } finally {
      setSaving(false);
    }
  };

  const boardLabel = (val) => BOARD_OPTIONS.find((b) => b.value === val)?.label || val;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Board Results' }]} />
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Board Results</h1>
          <p className="page-subtitle">Record Class X / XII board exam results, subject by subject.</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={loadResults} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={15} color="var(--primary)" />
            {editingId ? 'Edit Board Result' : 'Add Board Result'}
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Student *</label>
              {!form.studentId ? (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 2 }}>
                      <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '0.65rem', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '1.9rem' }}
                        placeholder="Search student by name or admission no..."
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                      />
                    </div>
                    <select className="form-select" style={{ flex: 1 }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                      <option value="">All Classes</option>
                      {CLASS_CONFIG.map((c) => (
                        <option key={c.internalValue} value={c.internalValue}>{c.displayLabel}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    {studentMatches.length === 0 ? (
                      <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No students found.</div>
                    ) : (
                      studentMatches.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setForm({ ...form, studentId: s.id })}
                          style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {toDisplayClassName(s.className)}{s.section ? ` (${s.section})` : ''} · {s.admissionNumber}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-secondary)' }}>
                  <span style={{ fontWeight: 600 }}>
                    {selectedStudent?.name}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
                      ({toDisplayClassName(selectedStudent?.className)}{selectedStudent?.section ? ` - ${selectedStudent.section}` : ''}) · {selectedStudent?.admissionNumber}
                    </span>
                  </span>
                  {!editingId && (
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setForm({ ...form, studentId: '' })}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Board *</label>
                <select className="form-select" value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}>
                  {BOARD_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Standard *</label>
                <select className="form-select" value={form.standard} onChange={(e) => setForm({ ...form, standard: e.target.value })}>
                  <option value="X">X</option>
                  <option value="XII">XII</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Academic Year *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2026-2027"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <label className="form-label">Subjects & Marks *</label>
              {form.subjects.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 2 }}
                    placeholder="Subject name"
                    value={s.subjectName}
                    onChange={(e) => updateSubjectRow(idx, 'subjectName', e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Marks (0-100)"
                    min="0"
                    max="100"
                    value={s.marks}
                    onChange={(e) => updateSubjectRow(idx, 'marks', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => removeSubjectRow(idx)}
                    disabled={form.subjects.length === 1}
                    title="Remove subject"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={addSubjectRow}>
                <Plus size={13} /> Add Subject
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Total Marks: <span style={{ color: 'var(--primary)' }}>{totalMarks}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {editingId && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>Cancel</button>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Result'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Saved Results</h3>
          <span className="badge badge-secondary">{results.length} Result{results.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Student</th>
                <th>Board</th>
                <th>Standard</th>
                <th>Academic Year</th>
                <th>Subjects</th>
                <th>Total</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>Loading...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>No board results recorded yet.</td></tr>
              ) : (
                results.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{r.studentName}<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.admissionNumber}</div></td>
                    <td><span className="badge badge-primary">{boardLabel(r.board)}</span></td>
                    <td>{r.standard}</td>
                    <td>{r.academicYear}</td>
                    <td style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                      {(r.subjects || []).map((s) => `${s.subjectName}: ${s.marks}`).join(', ')}
                    </td>
                    <td style={{ fontWeight: 700 }}>{r.totalMarks}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(r)}><Edit2 size={13} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
