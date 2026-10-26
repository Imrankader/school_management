import React, { useState, useEffect, useMemo } from 'react';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { CLASS_CONFIG, toDisplayClassName } from '../../utils/academicClassOrder';
import { IdCard, Search, Printer, CheckSquare, Square } from 'lucide-react';

export const IdCardsPage = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { addToast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await studentService.getAllStudents({ page: 1, pageSize: 10000, status: 'Active' });
      const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      setAllStudents([...list].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    } catch {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allStudents.filter((s) => {
      const textMatch = !term ||
        (s.name || '').toLowerCase().includes(term) ||
        (s.admissionNumber || '').toLowerCase().includes(term);
      const classMatch = !classFilter || s.className === classFilter;
      return textMatch && classMatch;
    });
  }, [allStudents, search, classFilter]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filtered.forEach((s) => next.delete(s.id));
      } else {
        filtered.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const selectedStudents = useMemo(
    () => allStudents.filter((s) => selectedIds.has(s.id)),
    [allStudents, selectedIds]
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));

  return (
    <div>
      <Breadcrumb items={[{ label: 'ID Cards' }]} />
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">ID Cards</h1>
          <p className="page-subtitle">Pick students and print their ID cards.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.print()}
          disabled={selectedStudents.length === 0}
        >
          <Printer size={15} /> Print {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ''}
        </button>
      </div>

      <div className="no-print">
        <div className="card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '0.65rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '1.9rem' }}
              placeholder="Search by name or admission no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ minWidth: '160px' }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {CLASS_CONFIG.map((c) => (
              <option key={c.internalValue} value={c.internalValue}>{c.displayLabel}</option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary btn-sm" onClick={toggleSelectAllFiltered}>
            {allFilteredSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            {allFilteredSelected ? 'Unselect All' : 'Select All'}
          </button>
          <span className="badge badge-secondary">{selectedIds.size} Selected</span>
        </div>

        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Student</th>
                <th>Class</th>
                <th>Admission No</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No students found.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => toggleSelect(s.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{toDisplayClassName(s.className)}{s.section ? ` (${s.section})` : ''}</td>
                    <td>{s.admissionNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedStudents.length > 0 && (
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Preview</h3>
        )}
      </div>

      <div className="id-card-sheet">
        {selectedStudents.map((s) => (
          <div className="id-card" key={s.id}>
            <div className="id-card-header">
              <IdCard size={14} />
              <span>EduCore School</span>
            </div>
            <div className="id-card-body">
              {s.photo ? (
                <img src={s.photo} alt={s.name} className="id-card-photo" />
              ) : (
                <div className="id-card-photo id-card-photo-placeholder">{(s.name?.[0] || 'S').toUpperCase()}</div>
              )}
              <div className="id-card-info">
                <div className="id-card-name">{s.name}</div>
                <div className="id-card-row">{toDisplayClassName(s.className)}{s.section ? ` - ${s.section}` : ''}</div>
                <div className="id-card-row">Adm No: {s.admissionNumber}</div>
                {s.dateOfBirth && <div className="id-card-row">DOB: {s.dateOfBirth}</div>}
                {s.bloodGroup && <div className="id-card-row">Blood Group: {s.bloodGroup}</div>}
                <div className="id-card-row">
                  {s.fatherMobileNumber || s.motherMobileNumber || s.guardianMobileNumber || s.contactNumber || '—'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .id-card-sheet {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .id-card {
          width: 340px;
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .id-card-header {
          background: var(--primary, #4338ca);
          color: #fff;
          padding: 0.5rem 0.75rem;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .id-card-body {
          display: flex;
          gap: 0.85rem;
          padding: 0.85rem;
          align-items: flex-start;
        }
        .id-card-photo {
          width: 70px;
          height: 86px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid var(--border-color, #cbd5e1);
          flex-shrink: 0;
        }
        .id-card-photo-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary, #f1f5f9);
          color: var(--text-muted, #64748b);
          font-size: 1.5rem;
          font-weight: 700;
        }
        .id-card-info { flex: 1; min-width: 0; }
        .id-card-name { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.3rem; }
        .id-card-row { font-size: 0.75rem; color: var(--text-secondary, #475569); margin-bottom: 0.15rem; }

        @media print {
          .no-print { display: none !important; }
          .page-header { display: none !important; }
          .id-card-sheet { gap: 0.5cm; }
          .id-card { box-shadow: none; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};
