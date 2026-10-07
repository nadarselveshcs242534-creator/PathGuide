import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RegistrationForm = ({ userProfile, onEnroll, onSearchCompleted }) => {
  const [careerInterest, setCareerInterest] = useState('');
  const [scholarships, setScholarships] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); 
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [schRes, crsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/scholarships'),
          axios.get('http://localhost:8000/api/courses')
        ]);
        setScholarships(schRes.data.scholarships || []);
        setCourses(crsRes.data.courses || []);
      } catch (err) {
        console.error("Failed to fetch opportunities catalog:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userProfile || !userProfile.fullName) {
      alert("Please complete your Profile in the navigation bar first to match with eligible scholarships.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: userProfile.fullName,
        academicYear: userProfile.academicYear,
        familyIncome: userProfile.familyIncome,
        category: userProfile.category,
        careerInterest: careerInterest
      };

      const response = await axios.post('http://localhost:8000/api/students', payload);
      setScholarships(response.data.matches || []);
      setCourses(response.data.courses || []);
      setIsFiltered(true);
      if (onSearchCompleted) {
        onSearchCompleted();
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to fetch ML matches. Ensure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = async () => {
    setLoading(true);
    try {
      const [schRes, crsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/scholarships'),
        axios.get('http://localhost:8000/api/courses')
      ]);
      setScholarships(schRes.data.scholarships || []);
      setCourses(crsRes.data.courses || []);
      setIsFiltered(false);
      setCareerInterest('');
    } catch (err) {
      console.error("Error resetting view:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Find Your Opportunities</h2>
      
      <form onSubmit={handleSubmit} className="match-form">
        
        {/* Dynamic Profile Context Banner */}
        {userProfile && userProfile.fullName ? (
          <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-focus)' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>
              <strong>Applying as:</strong> {userProfile.fullName} | {userProfile.category} | {userProfile.familyIncome}
              <br/>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>(You can update these details in the Profile tab)</span>
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger-color)' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--danger-color)', fontWeight: '600', margin: 0 }}>
              ⚠️ Please configure your Profile in the navigation bar to accurately filter scholarships based on your income and category.
            </p>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label htmlFor="careerInterest" className="form-label" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Describe your career goals & interests (AI NLP Engine will analyze this)
          </label>
          <textarea 
            id="careerInterest"
            className="form-control"
            placeholder="e.g., I want to study Machine Learning, Data Analytics, and Accounting for a tech career..."
            required
            rows={5}
            value={careerInterest} 
            onChange={e => setCareerInterest(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || !userProfile || !userProfile.fullName} 
            style={{ flex: 1 }}
          >
            {loading ? "Analyzing Alignment..." : "Scan & Rank Matches"}
          </button>

          {isFiltered && (
            <button 
              type="button" 
              onClick={resetSearch} 
              className="nav-btn" 
              style={{ border: '1px solid var(--border-color)', padding: '0.85rem 1.5rem', flex: 1 }}
            >
              Show All ({scholarships.length + courses.length})
            </button>
          )}
        </div>
      </form>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
            {isFiltered ? "Strictly Matching Opportunities" : "Browse All Available Opportunities"}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Showing {scholarships.length} Eligible Scholarships and {courses.length} Skill Courses
          </p>
        </div>

        <div className="btn-group" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            type="button"
            className={`nav-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            type="button"
            className={`nav-btn ${activeTab === 'scholarships' ? 'active' : ''}`}
            onClick={() => setActiveTab('scholarships')}
          >
            Scholarships
          </button>
          <button 
            type="button"
            className={`nav-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Courses
          </button>
        </div>
      </div>

      {initialLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading opportunities database...
        </div>
      ) : (
        <div className="results-section" aria-live="polite">
          
          {/* SCHOLARSHIPS SECTION */}
          {(activeTab === 'all' || activeTab === 'scholarships') && (
            <>
              <h3 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>
                🎓 Indian National & Corporate Scholarships ({scholarships.length})
              </h3>
              {scholarships.length === 0 ? (
                <p style={{ color: 'var(--danger-color)', marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>No eligible scholarships found.</strong> You currently do not meet the strict financial or category criteria for the scholarships in our database based on your profile.
                </p>
              ) : (
                <div className="cards-grid" style={{ marginBottom: '3rem' }}>
                  {scholarships.map((sch, index) => (
                    <div key={index} className="card">
                      {sch.ml_match_score !== undefined && (
                        <span className="match-badge scholarship">{sch.ml_match_score}% Match</span>
                      )}
                      <h4 className="card-title">{sch.name}</h4>
                      <p className="card-provider">Provider: {sch.provider}</p>
                      <p className="card-desc">{sch.description}</p>
                      
                      {sch.documentsRequired && sch.documentsRequired.length > 0 && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          marginBottom: '1.25rem', 
                          padding: '1rem', 
                          backgroundColor: 'var(--bg-main)', 
                          borderRadius: 'var(--radius-sm)', 
                          border: '1px solid var(--border-color)' 
                        }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            📄 Required Documents:
                          </p>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {sch.documentsRequired.map((doc, dIdx) => (
                              <li key={dIdx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="card-actions">
                        <a href={sch.url || '#'} target="_blank" rel="noreferrer" className="card-link">
                          Apply / View Portal →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* COURSES SECTION */}
          {(activeTab === 'all' || activeTab === 'courses') && (
            <>
              <h3 style={{ marginTop: '2rem', color: 'var(--text-primary)' }}>
                📚 Specialized Learning & Tech Courses ({courses.length})
              </h3>
              {courses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No courses found matching your career interest keywords.</p>
              ) : (
                <div className="cards-grid">
                  {courses.map((course, index) => (
                    <div key={index} className="card">
                      {course.ml_match_score !== undefined && (
                        <span className="match-badge" style={{ backgroundColor: 'var(--primary-color)' }}>
                          {course.ml_match_score}% Match
                        </span>
                      )}
                      <h4 className="card-title">{course.name}</h4>
                      <p className="card-provider">Platform: {course.provider}</p>
                      <p className="card-desc">{course.description}</p>

                      <div className="card-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <a href={course.url || '#'} target="_blank" rel="noreferrer" className="card-link">
                          Explore Course →
                        </a>
                        {onEnroll && (
                          <button
                            type="button"
                            onClick={() => onEnroll(course)}
                            style={{ 
                              border: '1px solid var(--primary-color)', 
                              padding: '0.4rem 0.85rem', 
                              fontSize: '0.85rem', 
                              color: 'var(--primary-color)',
                              fontWeight: '600',
                              cursor: 'pointer',
                              borderRadius: '999px',
                              background: 'var(--primary-light)',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
                            + Add to Roadmap
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default RegistrationForm;