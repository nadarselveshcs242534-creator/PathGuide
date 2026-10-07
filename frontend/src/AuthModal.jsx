import React, { useState } from 'react';
import axios from 'axios';

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    academicYear: 'Third Year (TY)',
    familyIncome: 'Below ₹1 Lakh',
    category: 'Open/General'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await axios.post(`http://localhost:8000${endpoint}`, formData);
      onLoginSuccess(res.data.email);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: isLogin ? '420px' : '550px',
          padding: 0, // Removed default padding to handle it internally
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden' // Keeps the outer rounded corners perfectly intact
        }}
      >
        {/* FIXED HEADER */}
        <div style={{ padding: '2rem 2.5rem 1rem', position: 'relative', flexShrink: 0 }}>
          <button className="close-btn" onClick={onClose} style={{ top: '1.5rem', right: '1.5rem', zIndex: 10 }}>&times;</button>
          <h2 style={{ textAlign: 'center', margin: 0, color: 'var(--text-primary)' }}>
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
        </div>

        {/* SCROLLABLE BODY */}
        <div style={{ overflowY: 'auto', padding: '0 2.5rem 2.5rem 2.5rem' }}>
          {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})} 
                  />
                </div>

                <div className="form-grid" style={{ marginBottom: '0' }}>
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <select 
                      className="form-control"
                      value={formData.academicYear} 
                      onChange={e => setFormData({...formData, academicYear: e.target.value})}
                    >
                      <option>First Year (FY)</option>
                      <option>Second Year (SY)</option>
                      <option>Third Year (TY)</option>
                      <option>Postgraduate (PG)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Family Annual Income</label>
                    <select 
                      className="form-control"
                      value={formData.familyIncome} 
                      onChange={e => setFormData({...formData, familyIncome: e.target.value})}
                    >
                      <option>Below ₹1 Lakh</option>
                      <option>₹1 Lakh – ₹2.5 Lakhs</option>
                      <option>₹2.5 Lakhs – ₹8 Lakhs</option>
                      <option>Above ₹8 Lakhs</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Social Category</label>
                  <select 
                    className="form-control"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Open/General</option>
                    <option>OBC</option>
                    <option>SC/ST</option>
                    <option>Minority</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                required
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                required
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Profile & Register')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Register Here' : 'Login Here'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;