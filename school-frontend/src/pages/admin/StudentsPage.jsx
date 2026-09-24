import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { BulkUploadModal } from '../../components/students/BulkUploadModal';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Upload,
  AlertTriangle
} from 'lucide-react';

export const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState({ totalStudents: 0, activeStudents: 0, presentStudents: 0, absentStudents: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, student: null, loading: false });
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    admNo: '',
    name: '',
    className: 'Class 10',
    section: 'A',
    dob: '2010-01-01',
    gender: 'Male',
    fatherName: '',
    motherName: '',
    guardianName: '',
    mobile: '',
    address: '',
    bloodGroup: 'O+',
  });

  const { addToast } = useToast();

  useEffect(() => {
    loadStudents(1);
  }, [search, statusFilter]);

  const loadParents = async () => {
    try {
      const res = await authService.getParents();
      if (res.success && res.data) {
        setParents(res.data);
      }
    } catch (err) {
      console.error('Failed to load parents list', err);
    }
  };

  const loadStudents = async (page = 1) => {
    try {
      setLoading(true);
      const res = await studentService.getAllStudents({ search, status: statusFilter, page, pageSize: pagination.pageSize || 20 });
      if (res.success && res.data) {
        setStudents(res.data.data);
        setPagination(res.data.pagination);
        setCounts({
          totalStudents: res.data.totalStudents,
          activeStudents: res.data.activeStudents,
          inactiveStudents: res.data.inactiveStudents || (res.data.totalStudents - res.data.activeStudents)
        });
      }
    } catch (err) {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      admNo: '',
      name: '',
      className: '',
      section: '',
      dob: '',
      gender: '',
      fatherName: '',
      motherName: '',
      guardianName: '',
      mobile: '',
      address: '',
      bloodGroup: '',
      joiningDate: '',
      isActive: true,
      phoneNumber: '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      admNo: student.admissionNumber || '',
      name: student.name || '',
      className: student.className || '',
      section: student.section || '',
      dob: student.dateOfBirth || '',
      gender: student.gender || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      guardianName: student.guardianName || '',
      mobile: student.contactNumber || '',
      address: student.address || '',
      bloodGroup: student.bloodGroup || '',
      joiningDate: student.joiningDate || '',
      isActive: student.isActive !== undefined ? student.isActive : true,
      phoneNumber: student.phoneNumber || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const openStatusModal = (student) => {
    setStatusModal({ isOpen: true, student, loading: false });
  };

  const confirmToggleStatus = async () => {
    const { student } = statusModal;
    if (!student) return;
    
    const isActivating = student.isActive === false;
    
    setStatusModal(prev => ({ ...prev, loading: true }));
    try {
      await studentService.updateStudentStatus(student.id, isActivating ? 'ACTIVE' : 'INACTIVE');
      addToast(`Student ${isActivating ? 'reactivated' : 'deactivated'} successfully`, 'success');
      loadStudents(pagination.page);
      setStatusModal({ isOpen: false, student: null, loading: false });
    } catch (err) {
      addToast(`Failed to ${isActivating ? 'reactivate' : 'deactivate'} student. Please try again.`, 'error');
      setStatusModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fatherName.trim() && !formData.motherName.trim() && !formData.guardianName.trim()) {
      addToast('Please provide at least one Father Name, Mother Name, or Guardian Name.', 'error');
      return;
    }

    try {
      const payload = {
        admissionNumber: formData.admNo,
        name: formData.name.trim(),
        className: formData.className,
        section: formData.section,
        dateOfBirth: formData.dob,
        gender: formData.gender,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        guardianName: formData.guardianName,
        contactNumber: formData.mobile,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        joiningDate: formData.joiningDate,
        isActive: formData.isActive,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        parentId: null
      };

      if (editingStudent) {
        await studentService.updateStudent(editingStudent.id, payload);
        addToast('Student updated successfully!', 'success');
      } else {
        await studentService.createStudent(payload);
        addToast('Student added successfully!', 'success');
      }
      setIsModalOpen(false);
      loadStudents(pagination.page);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add student', 'error');
    }
  };

  const getParentLabel = (parentId) => {
    if (!parentId) return 'Unassigned';
    const found = parents.find((p) => p.id === parentId);
    return found ? `${found.name} (ID #${found.id})` : `Parent ID #${parentId}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-subtitle">Manage student records, attendance, profiles, and parent information.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
            }}
          >
            <Upload size={18} /> Bulk Upload Students
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Count Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid var(--primary, #4f46e5)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary, #4f46e5)' }}>{counts.totalStudents}</div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>Total Students</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>All records</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid var(--success, #10b981)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success, #10b981)' }}>{counts.activeStudents}</div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>Active Students</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Currently active</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid var(--danger, #ef4444)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger, #ef4444)' }}>{counts.inactiveStudents}</div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>Inactive Students</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Currently inactive</p>
        </div>
      </div>

      {/* Search Bar & Filter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by student name, admission no, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem', borderRadius: '2rem', height: '42px' }}
          />
          <Search
            size={18}
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select 
            className="form-input" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ borderRadius: '2rem', height: '42px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Adm No</th>
              <th>Name</th>
              <th>Class & Section</th>
              <th>Mobile</th>
              <th>Parents</th>
              <th>Address</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  {loading ? 'Fetching student records...' : 'No students matching your search criteria.'}
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.admissionNumber}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {s.name}
                      {s.isActive === false && <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }}>Inactive</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DOB: {s.dateOfBirth} {s.gender ? `| ${s.gender}` : ''}</div>
                  </td>
                  <td>
                    <span className="badge badge-primary">{s.className} - {s.section}</span>
                  </td>
                  <td>{s.contactNumber || '—'}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {s.fatherName && <div>F: {s.fatherName}</div>}
                      {s.motherName && <div>M: {s.motherName}</div>}
                      {s.guardianName && <div>G: {s.guardianName}</div>}
                    </div>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.address || '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="btn btn-secondary btn-sm"
                        title="Edit profile"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => openStatusModal(s)}
                        className={`btn btn-sm ${s.isActive !== false ? 'btn-danger' : 'btn-success'}`}
                        title={s.isActive !== false ? 'Deactivate student' : 'Reactivate student'}
                      >
                        {s.isActive !== false ? <Trash2 size={15} /> : <UserCheck size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Showing {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} students
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => loadStudents(pagination.page - 1)}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum = pagination.page;
            if (pagination.totalPages <= 5) {
              pageNum = i + 1;
            } else if (pagination.page <= 3) {
              pageNum = i + 1;
            } else if (pagination.page >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i;
            } else {
              pageNum = pagination.page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                className={`btn btn-sm ${pageNum === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => loadStudents(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadStudents(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student Profile' : 'Add Student'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="studentForm" className="btn btn-primary">
              {editingStudent ? 'Save Changes' : 'Add Student'}
            </button>
          </>
        }
      >
        <form id="studentForm" onSubmit={handleFormSubmit}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-color)' }}>
            Student Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">S.No</label>
              <input type="text" className="form-input" disabled value="Auto-generated" />
            </div>
            <div className="form-group">
              <label className="form-label">Adm No</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Enter admission number"
                value={formData.admNo}
                onChange={(e) => setFormData({ ...formData, admNo: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Enter student name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Class</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Enter class"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Section</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Enter section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">DOB</label>
              <input
                type="date"
                className="form-input"
                required
                placeholder="Select date of birth"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-input"
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="" disabled>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />
          
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-color)' }}>
            Parent / Guardian Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Father Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter father's name"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mother Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter mother's name"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Guardian Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter guardian's name"
              value={formData.guardianName}
              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
            />
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
            At least one parent or guardian name is required.
          </p>

          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />

          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-color)' }}>
            Contact Information
          </h3>

          <div className="form-group">
            <label className="form-label">Mobile</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="Enter residential address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Blood Group</label>
            <select
              className="form-input"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            >
              <option value="" disabled>Select blood group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />

          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-color)' }}>
            School Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input
                type="date"
                className="form-input"
                placeholder="Select joining date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Active Student</label>
              <select
                className="form-input"
                value={formData.isActive ? 'Active' : 'Inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Active' })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />

          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-color)' }}>
            Student Portal Login
          </h3>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter parent login phone number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter temporary password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Students Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadStudents}
      />

      {/* Confirm Status Modal */}
      {statusModal.isOpen && statusModal.student && (() => {
        const isActivating = statusModal.student.isActive === false;
        return (
          <Modal
            isOpen={statusModal.isOpen}
            onClose={() => !statusModal.loading && setStatusModal({ isOpen: false, student: null, loading: false })}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isActivating ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)' }}>
                {isActivating ? <UserCheck size={20} /> : <AlertTriangle size={20} />}
                {isActivating ? 'Reactivate Student' : 'Deactivate Student'}
              </div>
            }
            footer={
              <>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setStatusModal({ isOpen: false, student: null, loading: false })}
                  disabled={statusModal.loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`btn ${isActivating ? 'btn-success' : 'btn-danger'}`}
                  onClick={confirmToggleStatus}
                  disabled={statusModal.loading}
                >
                  {statusModal.loading ? (isActivating ? 'Reactivating...' : 'Deactivating...') : (isActivating ? 'Reactivate Student' : 'Deactivate Student')}
                </button>
              </>
            }
          >
            <div style={{ padding: '0.5rem 0' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1rem' }}>
                {isActivating 
                  ? 'Are you sure you want to reactivate this student?' 
                  : 'Are you sure you want to deactivate this student?'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {isActivating 
                  ? 'The student will be moved back to Active status.' 
                  : 'The student will be moved to Inactive status. The student record will not be permanently deleted.'}
              </p>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
