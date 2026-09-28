import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GraduationCap, LogIn, KeyRound, User, Sparkles, Phone, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [mode, setMode] = useState('parent'); // 'parent' or 'staff'
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login, parentLogin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'parent') {
      if (!phoneNumber || !password) {
        addToast('Please enter both phone number and password', 'warning');
        return;
      }
    } else {
      if (!email || !password) {
        addToast('Please enter both email and password', 'warning');
        return;
      }
    }

    try {
      setSubmitting(true);
      let user;
      if (mode === 'parent') {
        user = await parentLogin({ phoneNumber, password });
      } else {
        user = await login({ email, password });
      }

      addToast(`Welcome back, ${user.name || user.email}!`, 'success');

      // Navigate based on role
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TEACHER') navigate('/teacher');
      else if (user.role === 'PARENT') navigate('/parent');
      else navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (role, val1, val2) => {
    if (role === 'parent') {
      setMode('parent');
      setPhoneNumber(val1);
      setPassword(val2);
    } else {
      setMode('staff');
      setEmail(val1);
      setPassword(val2);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.2) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.15) 0, transparent 50%)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Portal Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-main, #f1f5f9)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '4px',
            marginBottom: '1.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('parent')}
            style={{
              flex: 1,
              padding: '0.55rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'parent' ? '#ffffff' : 'transparent',
              color: mode === 'parent' ? 'var(--primary, #4f46e5)' : 'var(--text-muted, #64748b)',
              fontWeight: mode === 'parent' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: mode === 'parent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Parent Portal
          </button>
          <button
            type="button"
            onClick={() => setMode('staff')}
            style={{
              flex: 1,
              padding: '0.55rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'staff' ? '#ffffff' : 'transparent',
              color: mode === 'staff' ? 'var(--primary, #4f46e5)' : 'var(--text-muted, #64748b)',
              fontWeight: mode === 'staff' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: mode === 'staff' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Staff Portal
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#fff',
              boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)',
            }}
          >
            <GraduationCap size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {mode === 'parent' ? 'Parent Portal Login' : 'EduCore Portal'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {mode === 'parent'
              ? "Sign in to access your child's student portal"
              : 'Sign in to access your dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'parent' ? (
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter parent login phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
                <Phone
                  size={18}
                  style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
                <User
                  size={18}
                  style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder={mode === 'parent' ? 'Enter parent login password' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                required
              />
              <KeyRound
                size={18}
                style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            <LogIn size={18} />
            {submitting ? 'Authenticating...' : mode === 'parent' ? 'Login' : 'Sign In'}
          </button>
        </form>

        {/* Demo Quick Fill Helper */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <Sparkles size={14} color="var(--primary)" />
            <span>Quick Demo Credentials</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('admin', 'admin@school.com', 'Admin@123')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('teacher', 'teacher@school.com', 'Teacher@123')}
            >
              Teacher
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('parent', '9876543210', 'Parent@123')}
            >
              Parent
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};
