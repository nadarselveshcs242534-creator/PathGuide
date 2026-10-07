import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ userEmail, userProfile, setUserProfile }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    academicYear: 'Third Year (TY)',
    familyIncome: 'Below ₹1 Lakh',
    category: 'Open/General',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing profile data if available
  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        academicYear: userProfile.academicYear || 'Third Year (TY)',
        familyIncome: userProfile.familyIncome || 'Below ₹1 Lakh',
        category: userProfile.category || 'Open/General',
      });
    }
  }, [userProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await axios.post('http://localhost:8000/api/profile', {
        email: userEmail,
        ...formData
      });
      setUserProfile(formData);
      setMessage('✅ Profile saved successfully! You can now use the AI matcher.');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error("Failed to save profile", error);
      setMessage('❌ Failed to save profile. Ensure backend is running.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '650px', marginTop: '2rem' }}>
      <div className="roadmap-header">
        <h2>Your Academic Profile</h2>
        <p>This information is securely used to filter eligible Indian scholarships and grants automatically when you search for opportunities.</p>
      </div>

      <form onSubmit={handleSave} className="match-form">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-control" 
            required
            placeholder="Enter your full name as per official documents"
            value={formData.fullName} 
            onChange={e => setFormData({...formData, fullName: e.target.value})} 
          />
        </div>

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

        <div className="form-group" style={{ marginBottom: '2rem' }}>
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

        <button type="submit" className="submit-btn" disabled={saving}>
          {saving ? 'Saving Profile...' : 'Save Profile'}
        </button>
        
        {message && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontWeight: '600', color: message.includes('✅') ? 'var(--success-color)' : 'var(--danger-color)' }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default Profile;