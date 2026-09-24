import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Users, CalendarCheck, UserCheck, UserX, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api'; // Or use native fetch if api is different

export const AttendancePage = () => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entityType, setEntityType] = useState('STUDENT');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, records: [] });
  const [loading, setLoading] = useState(false);
  
  const [modalState, setModalState] = useState({ isOpen: false, type: null }); // 'present' or 'absent'
  const { addToast } = useToast();

  useEffect(() => {
    if (entityType === 'STUDENT') {
      loadClasses();
    }
  }, [entityType]);

  useEffect(() => {
    loadAttendanceSummary();
  }, [date, entityType, classId, section]);

  const loadClasses = async () => {
    try {
      const res = await api.get('/api/academics/classes');
      if (res.data?.success && res.data?.data) {
        setClasses(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load classes', error);
    }
  };

  const loadAttendanceSummary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date, entityType });
      if (entityType === 'STUDENT') {
        if (classId) params.append('classId', classId);
        if (section) params.append('sectionId', section);
      }
      
      const res = await api.get(`/api/attendance/summary?${params.toString()}`);
      if (res.data?.success) {
        const data = res.data.data;
        // If the backend doesn't properly calculate total students yet because we used a fallback
        // we can attempt to fetch total students if we are looking at students
        let total = data.total || 0;
        
        if (total === 0 && entityType === 'STUDENT') {
           const studentRes = await api.get('/api/students', { params: { pageSize: 1, search: '' } });
           if (studentRes.data?.success) {
              total = studentRes.data.data.totalStudents || 0;
           }
        }
        
        setSummary({
          total: total,
          present: data.present || 0,
          absent: data.absent || 0,
          records: data.records || []
        });
      }
    } catch (err) {
      addToast('Unable to load attendance data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEntityLabel = () => {
    if (entityType === 'STUDENT') return 'Students';
    if (entityType === 'TEACHER') return 'Teachers';
    return 'Workers';
  };

  const filteredRecords = () => {
    if (modalState.type === 'present') {
      return summary.records.filter(r => r.status === 'PRESENT');
    }
    return summary.records.filter(r => r.status === 'ABSENT');
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Monitor student, teacher, and worker attendance.</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
          <label className="form-label">Attendance Date</label>
          <input 
            type="date" 
            className="form-input" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
          <label className="form-label">Attendance For</label>
          <select 
            className="form-input"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setClassId('');
              setSection('');
            }}
          >
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="WORKER">Workers</option>
          </select>
        </div>

        {entityType === 'STUDENT' && (
          <>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
              <label className="form-label">Class</label>
              <select className="form-input" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className}</option>
                ))}
                {classes.length === 0 && <option value="Class 10">Class 10</option>}
              </select>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
              <label className="form-label">Section</label>
              <select className="form-input" value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="">All Sections</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid var(--primary, #4f46e5)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary, #4f46e5)' }}>
            {loading ? '...' : summary.total}
          </div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>Total {getEntityLabel()}</h3>
        </div>
        
        <div 
          className="card" 
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid var(--success, #10b981)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
          onClick={() => setModalState({ isOpen: true, type: 'present' })}
          onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
        >
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success, #10b981)' }}>
            {loading ? '...' : summary.present}
          </div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>Present</h3>
        </div>

        <div 
          className="card" 
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid var(--danger, #ef4444)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
          onClick={() => setModalState({ isOpen: true, type: 'absent' })}
          onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
        >
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger, #ef4444)' }}>
            {loading ? '...' : summary.absent}
          </div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>Absent</h3>
        </div>
      </div>

      {/* List Modal */}
      {modalState.isOpen && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, type: null })}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: modalState.type === 'present' ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)' }}>
              {modalState.type === 'present' ? <UserCheck size={20} /> : <UserX size={20} />}
              {modalState.type === 'present' ? `Present ${getEntityLabel()}` : `Absent ${getEntityLabel()}`}
            </div>
          }
          footer={
            <button type="button" className="btn btn-secondary" onClick={() => setModalState({ isOpen: false, type: null })}>
              Close
            </button>
          }
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              {classId ? ` • Class ${classId}` : ''}{section ? ` - ${section}` : ''}
            </p>

            {filteredRecords().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                <CalendarCheck size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                No {modalState.type} {getEntityLabel().toLowerCase()} for this date.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{entityType === 'STUDENT' ? 'Student' : 'Name'}</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords().map(record => (
                      <tr key={record.id}>
                        <td style={{ fontWeight: 600 }}>{record.personId}</td>
                        <td>Person #{record.personId}</td>
                        <td>
                          <span className={`badge badge-${record.status === 'PRESENT' ? 'success' : 'danger'}`}>
                            {record.status === 'PRESENT' ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
