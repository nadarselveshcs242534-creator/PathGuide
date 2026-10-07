import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Home = ({ onExplore, demandData }) => {
  const [courses, setCourses] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [expandedField, setExpandedField] = useState(null);

  // Fetch all resources so we can populate the dropdowns
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [schRes, crsRes] = await Promise.all([
          axios.get('https://cep-pathguide-backend.onrender.com/api/scholarships'),
          axios.get('https://cep-pathguide-backend.onrender.com/api/courses')
        ]);
        setScholarships(schRes.data.scholarships || []);
        setCourses(crsRes.data.courses || []);
      } catch (err) {
        console.error("Failed to fetch catalog for home page:", err);
      }
    };
    fetchCatalog();
  }, []);

  // Map the demand graph fields to search keywords
  const filterItems = (field, items) => {
    const categories = {
      "AI & Machine Learning": ["ai", "machine learning", "ml", "deep learning", "neural", "vision", "nlp", "llm", "prompt", "generative"],
      "Cybersecurity": ["cyber", "security", "hacking", "network", "firewall", "cryptography"],
      "Software Engineering": ["web", "full stack", "react", "python", "javascript", "developer", "software", "java", "coding"],
      "Data Science & Analytics": ["data", "analytics", "sql", "tableau", "statistics", "pandas", "bi", "big data"],
      "Digital Marketing & SEO": ["marketing", "seo", "social media", "content", "ads"],
      "General Computing": ["computer", "it", "hardware", "technology", "basic"]
    };

    const keywords = categories[field] || categories["General Computing"];
    
    const matched = items.filter(item => {
      const text = ((item.name || "") + " " + (item.description || "")).toLowerCase();
      return keywords.some(k => text.includes(k));
    });

    // Return the top 5 matches for the dropdown
    return matched.slice(0, 5);
  };

  const toggleExpand = (field) => {
    setExpandedField(expandedField === field ? null : field);
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Empowering Your Academic Journey</h1>
        <p className="hero-subtitle">
          Navigate your career with AI-driven insights, discover personalized scholarships, and track your skill milestones in real-time.
        </p>
        <button className="primary-btn" onClick={onExplore}>
          Find Your Opportunities →
        </button>
      </section>

      {/* Features Grid */}
      <section className="home-grid">
        <div className="synopsis-card">
          <h3>🎯 Intelligent AI Matching</h3>
          <ul className="synopsis-list">
            <li><strong>NLP Filtering:</strong> We analyze your career interests to find perfect course alignments.</li>
            <li><strong>Strict Eligibility:</strong> Scholarships are filtered instantly by your income and category.</li>
          </ul>
        </div>
        <div className="synopsis-card">
          <h3>🛣️ Skill Progression Tracking</h3>
          <ul className="synopsis-list">
            <li><strong>Milestone Roadmaps:</strong> Record and monitor your module completions.</li>
            <li><strong>RAG Verification:</strong> AI cross-checks your learning against official syllabi.</li>
          </ul>
        </div>
        <div className="synopsis-card">
          <h3>🤖 Real-Time Career Guide</h3>
          <ul className="synopsis-list">
            <li><strong>Consult the AI:</strong> Ask Groq LPU specific questions about salaries or certifications.</li>
            <li><strong>Context Memory:</strong> The chatbot remembers your previous session conversations.</li>
          </ul>
        </div>
      </section>

      {/* Demand Section */}
      <section className="demand-section">
        <div className="demand-header" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem' }}>Most In-Demand Domains (Real-Time Search Trends)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Aggregated real-time metrics dynamically updated based on active student searches. 
            <strong style={{ color: 'var(--primary-color)' }}> Click on any field below to view related Courses and Scholarships!</strong>
          </p>
        </div>

        {demandData && demandData.length > 0 ? (
          <div className="demand-chart">
            {demandData.map((data, index) => {
              const isExpanded = expandedField === data.field;
              const matchedCourses = isExpanded ? filterItems(data.field, courses) : [];
              const matchedScholarships = isExpanded ? filterItems(data.field, scholarships) : [];

              return (
                <div 
                  key={index} 
                  className={`demand-item ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(data.field)}
                >
                  <div className="chart-label-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      {data.field}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                      </span>
                    </span>
                    <span>{data.percentage}% <span style={{ fontSize: '0.85em', color: 'var(--text-muted)', fontWeight: 'normal' }}>({data.count})</span></span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${data.percentage}%`,
                        backgroundColor: data.color || 'var(--primary-color)',
                      }}
                    />
                  </div>

                  {/* Dropdown Content */}
                  {isExpanded && (
                    <div className="demand-dropdown" onClick={(e) => e.stopPropagation()}>
                      {/* Courses Column */}
                      <div className="dropdown-column">
                        <h5>📚 Recommended Courses</h5>
                        {matchedCourses.length > 0 ? (
                          <ul className="dropdown-list">
                            {matchedCourses.map((c, i) => (
                              <li key={i}>
                                <a href={c.url !== '#' ? c.url : undefined} target="_blank" rel="noreferrer">
                                  {c.name}
                                </a>
                                <span className="dropdown-meta">{c.provider}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="dropdown-empty">No specific courses found for this field yet.</p>
                        )}
                      </div>
                      
                      {/* Scholarships Column */}
                      <div className="dropdown-column">
                        <h5>🎓 Relevant Scholarships</h5>
                        {matchedScholarships.length > 0 ? (
                          <ul className="dropdown-list">
                            {matchedScholarships.map((s, i) => (
                              <li key={i}>
                                <a href={s.url !== '#' ? s.url : undefined} target="_blank" rel="noreferrer">
                                  {s.name}
                                </a>
                                <span className="dropdown-meta">{s.provider}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="dropdown-empty">No specific scholarships found for this field yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Gathering real-time search trends...</p>
        )}
      </section>
    </div>
  );
};

export default Home;
