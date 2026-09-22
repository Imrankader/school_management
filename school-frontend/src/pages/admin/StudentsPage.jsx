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
} from 'lucide-react';

export const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
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
    loadStudents();
    loadParents();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredStudents(students);
    } else {
      const q = search.toLowerCase();
      setFilteredStudents(
        students.filter(
          (s) =>
            s.name?.toLowerCase().includes(q) ||
            s.admissionNumber?.toLowerCase().includes(q) ||
            s.className?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, students]);

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

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await studentService.getAllStudents();
      if (res.success && res.data) {
        const mappedData = res.data;
        setStudents(mappedData);
        setFilteredStudents(mappedData);
      }
    } catch (err) {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    const defaultParentId = parents.length > 0 ? parents[0].id : '';
    setFormData({
      admNo: `RN-${Math.floor(1000 + Math.random() * 9000)}`,
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
      gender: student.gender || 'Male',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      guardianName: student.guardianName || '',
      mobile: student.contactNumber || '',
      address: student.address || '',
      bloodGroup: student.bloodGroup || 'O+',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    try {
      await studentService.deleteStudent(id);
      addToast('Student deleted successfully', 'success');
      loadStudents();
    } catch (err) {
      addToast('Failed to delete student', 'error');
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
      loadStudents();
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
          <p className="page-subtitle">Manage student enrollments, profiles, and parent associations.</p>
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

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by student name, roll number, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
          <Search
            size={18}
            style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
          />
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
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  {loading ? 'Fetching student records...' : 'No students matching your search criteria.'}
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.admissionNumber}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
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
                        onClick={() => handleDelete(s.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete student"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mother Name</label>
              <input
                type="text"
                className="form-input"
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
              value={formData.guardianName}
              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
            />
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
            At least one parent or guardian name is required.
          </p>

          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />

          <div className="form-group">
            <label className="form-label">Mobile</label>
            <input
              type="text"
              className="form-input"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-input"
              rows="2"
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
              <option value="">-- Select Blood Group --</option>
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
        </form>
      </Modal>

      {/* Bulk Upload Students Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadStudents}
      />
    </div>
  );
};
