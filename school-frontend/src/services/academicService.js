import api from './api';

export const academicService = {
  // Classes
  getAllClasses: async () => {
    const response = await api.get('/api/academic/classes');
    return response.data;
  },

  createClass: async (classData) => {
    const response = await api.post('/api/academic/classes', classData);
    return response.data;
  },

  // Subjects
  getAllSubjects: async () => {
    const response = await api.get('/api/academic/subjects');
    return response.data;
  },

  createSubject: async (subjectData) => {
    const response = await api.post('/api/academic/subjects', subjectData);
    return response.data;
  },

  // Exams
  getAllExams: async () => {
    const response = await api.get('/api/academic/exams');
    return response.data;
  },

  createExam: async (examData) => {
    const response = await api.post('/api/academic/exams', examData);
    return response.data;
  },

  // Marks
  submitMarks: async (markData) => {
    const response = await api.post('/api/academic/marks', markData);
    return response.data;
  },

  getMarksByStudent: async (studentId) => {
    const response = await api.get(`/api/academic/marks/student/${studentId}`);
    return response.data;
  },

  // Board Results
  getBoardResults: async () => {
    const response = await api.get('/api/academic/board-results');
    return response.data;
  },

  createBoardResult: async (data) => {
    const response = await api.post('/api/academic/board-results', data);
    return response.data;
  },

  updateBoardResult: async (id, data) => {
    const response = await api.put(`/api/academic/board-results/${id}`, data);
    return response.data;
  },

  deleteBoardResult: async (id) => {
    const response = await api.delete(`/api/academic/board-results/${id}`);
    return response.data;
  },
};
