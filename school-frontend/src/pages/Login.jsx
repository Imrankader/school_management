import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GraduationCap, LogIn, KeyRound, User, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react';

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
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: '2.25rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              color: '#fff',
            }}
          >
            <GraduationCap size={24} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            EduCore
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
            School Management SaaS Platform
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('parent')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: mode === 'parent' ? '#ffffff' : 'transparent',
              color: mode === 'parent' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: mode === 'parent' ? 600 : 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: mode === 'parent' ? 'var(--shadow-xs)' : 'none',
              transition: 'var(--transition)',
            }}
          >
            Parent Portal
          </button>
          <button
            type="button"
            onClick={() => setMode('staff')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: mode === 'staff' ? '#ffffff' : 'transparent',
              color: mode === 'staff' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: mode === 'staff' ? 600 : 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: mode === 'staff' ? 'var(--shadow-xs)' : 'none',
              transition: 'var(--transition)',
            }}
          >
            Staff Portal
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'parent' ? (
            <div className="form-group">
              <label className="form-label">Parent Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter registered mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
                <Phone
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)',
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
                <User
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)',
                  }}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                required
              />
              <KeyRound
                size={15}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem', fontWeight: 600, marginBottom: '1.25rem' }}
            disabled={submitting}
          >
            <LogIn size={15} />
            <span>{submitting ? 'Authenticating...' : mode === 'parent' ? 'Sign In as Parent' : 'Sign In as Staff'}</span>
          </button>
        </form>

        {/* Demo Quick-Fill Credentials */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quick Demo Login
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
              onClick={() => handleQuickFill('staff', 'admin@school.com', 'admin123')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
              onClick={() => handleQuickFill('staff', 'teacher@school.com', 'teacher123')}
            >
              Teacher
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
              onClick={() => handleQuickFill('parent', '9876543210', 'parent123')}
            >
              Parent
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Need new credentials?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Register staff
          </Link>
        </div>
      </div>
    </div>
  );
};
