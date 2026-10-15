import React, { useState, useEffect, useMemo } from 'react';
import { homeworkService } from '../../services/homeworkService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { BookOpen, Plus, Trash2, Calendar, Edit2, Search, ClipboardList, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CLASS_CONFIG, toDisplayClassName, compareAcademicClasses } from '../../utils/academicClassOrder';

const emptyCreateForm = () => ({
  title: '',
  description: '',
  className: 'Class 10',
  section: '',
  dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
});

// A due date is the one piece of information a teacher or parent actually scans for first —
// show how urgent it is, not just what it is.
const getUrgency = (dueDate) => {
  if (!dueDate) return { label: 'No due date', tone: 'secondary' };
  const today = new Date(new Date().toDateString());
  const due = new Date(dueDate);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, tone: 'danger' };
  if (days === 0) return { label: 'Due today', tone: 'warning' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'warning' };
  if (days <= 7) return { label: `Due in ${days}d`, tone: 'primary' };
  return { label: `Due in ${days}d`, tone: 'secondary' };
};

export const HomeworkPage = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm());

  const [editModal, setEditModal] = useState(false);
  const [editingHw, setEditingHw] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', className: '', section: '', dueDate: '' });

  const { addToast } = useToast();

  useEffect(() => {
    loadHomework();
  }, []);

  const loadHomework = async () => {
    try {
      setLoading(true);
      const res = await homeworkService.getAll();
      setHomeworkList(res.success && res.data ? res.data : []);
    } catch (err) {
      addToast('Failed to load homework assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await homeworkService.create(createForm);
      addToast('Homework published — visible to every parent in that class now.', 'success');
      setCreateModal(false);
      setCreateForm(emptyCreateForm());
      loadHomework();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to publish homework', 'error');
    }
  };

  const openEditModal = (hw) => {
    setEditingHw(hw);
    setEditForm({
      title: hw.title || '',
      description: hw.description || '',
      className: hw.className || '',
      section: hw.section || '',
      dueDate: hw.dueDate || '',
    });
    setEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingHw) return;
    try {
      await homeworkService.update(editingHw.id, editForm);
      addToast('Homework updated.', 'success');
      setEditModal(false);
      setEditingHw(null);
      loadHomework();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update homework', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this homework? Parents will no longer see it.')) return;
    try {
      await homeworkService.delete(id);
      addToast('Homework deleted.', 'success');
      loadHomework();
    } catch (err) {
      addToast('Failed to delete homework', 'error');
    }
  };

  const uniqueClasses = useMemo(
    () => Array.from(new Set(homeworkList.map((h) => h.className).filter(Boolean))).sort(compareAcademicClasses),
    [homeworkList]
  );

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return homeworkList
      .filter((h) => classFilter === 'ALL' || h.className === classFilter)
      .filter((h) => !term || h.title?.toLowerCase().includes(term) || h.description?.toLowerCase().includes(term))
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  }, [homeworkList, classFilter, searchTerm]);

  const stats = useMemo(() => {
    const today = new Date(new Date().toDateString());
    let overdue = 0, dueThisWeek = 0;
    homeworkList.forEach((h) => {
      if (!h.dueDate) return;
      const days = Math.round((new Date(h.dueDate) - today) / 86400000);
      if (days < 0) overdue++;
      else if (days <= 7) dueThisWeek++;
    });
    return { total: homeworkList.length, overdue, dueThisWeek };
  }, [homeworkList]);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Homework Management' }]} />

      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen className="text-primary" /> Homework Management
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
            Publish an assignment to a class and it shows up for every parent and teacher in it right away.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={18} /> Assign Homework
        </button>
      </div>

      {/* Quick stats — real signals (what needs attention), not decoration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClipboardList size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1 }}>{stats.total}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total assignments</div>
          </div>
        </div>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'rgba(217,119,6,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={18} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1 }}>{stats.dueThisWeek}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due within 7 days</div>
          </div>
        </div>
        <div className="card" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color="var(--danger)" />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1 }}>{stats.overdue}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Past due date</div>
          </div>
        </div>
      </div>

      {/* Search + class filter */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <Search size={15} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '200px', border: 'none', padding: '0.25rem 0', boxShadow: 'none' }}
        />
        <select
          className="form-input"
          style={{ width: 'auto' }}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="ALL">All Classes ({homeworkList.length})</option>
          {uniqueClasses.map((c) => (
            <option key={c} value={c}>{toDisplayClassName(c)}</option>
          ))}
        </select>
      </div>

      {/* Homework Table */}
      <div className="table-container">
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Class & Section</th>
              <th>Due</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <BookOpen size={32} style={{ opacity: 0.35, display: 'block', margin: '0 auto 0.75rem' }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {loading
                      ? 'Loading homework...'
                      : homeworkList.length === 0
                      ? 'No homework published yet.'
                      : 'Nothing matches your search.'}
                  </div>
                  {!loading && homeworkList.length === 0 && (
                    <button className="btn btn-primary btn-sm" onClick={() => setCreateModal(true)}>
                      <Plus size={14} /> Assign the first one
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredList.map((hw) => {
                const urgency = getUrgency(hw.dueDate);
                return (
                  <tr key={hw.id}>
                    <td style={{ maxWidth: '420px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{hw.title}</div>
                      {hw.description && (
                        <div style={{
                          fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {hw.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {toDisplayClassName(hw.className)}{hw.section ? ` (${hw.section})` : ' — all sections'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${urgency.tone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                        <Calendar size={12} /> {urgency.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(hw)} style={{ marginRight: '0.5rem' }} title="Edit homework">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(hw.id)} title="Delete homework">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Assign New Homework"
        icon={BookOpen}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
            <button type="submit" form="createHwForm" className="btn btn-primary">
              <CheckCircle2 size={15} style={{ marginRight: '0.3rem' }} /> Publish Homework
            </button>
          </>
        }
      >
        <form id="createHwForm" onSubmit={handleCreate}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Chapter 4, Exercise 1–10"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Class *</label>
              <select
                className="form-control"
                required
                value={createForm.className}
                onChange={(e) => setCreateForm({ ...createForm, className: e.target.value })}
              >
                {CLASS_CONFIG.map((c) => (
                  <option key={c.internalValue} value={c.internalValue}>{c.displayLabel}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Section</label>
              <input
                type="text"
                className="form-control"
                placeholder="All"
                value={createForm.section}
                onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-control"
                required
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.6rem', marginBottom: '1rem' }}>
            Leave Section blank to publish to the whole class.
          </p>

          <div className="form-group" style={{ marginBottom: '0.25rem' }}>
            <label className="form-label">Instructions *</label>
            <textarea
              className="form-control"
              rows={4}
              required
              placeholder="What should students do? Be specific — this is what parents and students will read."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Homework"
        icon={Edit2}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
            <button type="submit" form="editHwForm" className="btn btn-primary">Save Changes</button>
          </>
        }
      >
        <form id="editHwForm" onSubmit={handleUpdate}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-control"
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Class *</label>
              <select
                className="form-control"
                required
                value={editForm.className}
                onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
              >
                {CLASS_CONFIG.map((c) => (
                  <option key={c.internalValue} value={c.internalValue}>{c.displayLabel}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Section</label>
              <input
                type="text"
                className="form-control"
                placeholder="All"
                value={editForm.section}
                onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-control"
                required
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.25rem' }}>
            <label className="form-label">Instructions *</label>
            <textarea
              className="form-control"
              rows={4}
              required
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
