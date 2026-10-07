import React from 'react';

const AboutUs = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h2>About PathGuide</h2>
        <p>
          Welcome to the PathGuide Platform. This project is dedicated to providing students with AI-driven, personalized career guidance. By leveraging machine learning, we map your academic background, financial needs, and career interests directly to scholarships, roadmap courses, and real-time industry demand—helping you navigate the complex transition from education to a successful career.
        </p>
      </div>

      <div className="team-grid">
        {/* Profile 1: Selvesh */}
        <div className="team-card">
          <div className="team-avatar" style={{ background: 'var(--primary-color)' }}>
            <span>SN</span>
          </div>
          <h3 className="team-name">Selvesh Sathiyaseelan Nadar</h3>
          <p className="team-role">Web Developer & AI Integrator</p>
          <p className="team-college">Sheth L.U.J. and Sir M.V. College</p>
          <p className="team-bio">
            Selvesh drives the technical architecture of the PathGuide platform, developing the FastAPI backend, React frontend, and integrating the Groq LLM capabilities to create a seamless, AI-powered experience.
          </p>
        </div>

        {/* Profile 2: Omith */}
        <div className="team-card">
          <div className="team-avatar" style={{ background: 'var(--accent-gradient)' }}>
            <span>OT</span>
          </div>
          <h3 className="team-name">Omith Thilakan</h3>
          <p className="team-role">Data Miner & Survey Collector</p>
          <p className="team-college">Sheth L.U.J. and Sir M.V. College</p>
          <p className="team-bio">
            Omith is a dedicated third-year B.Sc. student responsible for curating, verifying, and structuring the comprehensive scholarship and course datasets that power our machine learning recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
