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
        <div className="team-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="team-avatar" style={{ background: 'var(--primary-color)' }}>
            <span>SN</span>
          </div>
          <h3 className="team-name">Selvesh Sathiyaseelan Nadar</h3>
          <p className="team-role">Web Developer & AI Integrator</p>
          <p className="team-bio" style={{ textAlign: 'justify', marginBottom: '2rem' }}>
            Selvesh is a B.Sc. Computer Science student with a strong interest in Artificial Intelligence, Machine Learning, Web Development, Software Development and Data Analytics. He is serving as an Instructor Assistant for Data Viusalization with Tableau Course at Rock The IT, supporting students in their learning and practical activities. He is also focused on building practical projects using Python, React, JavaScript, databases, and APIs to develop useful technology solutions. Selvesh also serves as DLLE (Department of life long extension) Student Manager in his college since last acedemic year.
          </p>
          
          {/* Vertical Left-Aligned Contact Block */}
          <div style={{ marginTop: 'auto', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', wordBreak: 'break-word' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Email:</strong>
              <a href="mailto:nadarselveshcs242534@gmail.com" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.95rem' }}>nadarselveshcs242534@gmail.com</a>
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Contact:</strong> 
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>+91 8898732383</span>
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>LinkedIn:</strong>
              <a href="https://www.linkedin.com/in/selvesh-nadar" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.95rem' }}>https://www.linkedin.com/in/selvesh-nadar</a>
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Portfolio:</strong>
              <a href="https://aboutselveshsathiyaseelannadar.netlify.app/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.95rem' }}>https://aboutselveshsathiyaseelannadar.netlify.app/</a>
            </div>
          </div>
        </div>

        {/* Profile 2: Omith */}
        <div className="team-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="team-avatar" style={{ background: 'var(--accent-gradient)' }}>
            <span>OT</span>
          </div>
          <h3 className="team-name">Omith Thilakan</h3>
          <p className="team-role">Data Miner & Survey Collector</p>
          <p className="team-bio" style={{ textAlign: 'justify', marginBottom: '2rem' }}>
            Omith Thilakan is a dedicated third-year B.Sc. Computer Science (TYCS) student based in Mumbai, Maharashtra. Currently enrolled at Sheth L.U.J. and Sir M.V. College, he possesses robust technical expertise spanning Python, Java, Node.js, Database Management, and cyber security. Complementing a specialized background in AI Prompt Engineering, Omith actively cultivates a strong interest in academic and technological research. He authored a study titled "Comparative Analysis of ARIMA and LSTM for Gold Price Prediction", which investigated modern financial forecasting methodologies, demonstrating that deep learning LSTM networks improve prediction accuracy by up to 37.78% over traditional ARIMA models under volatile market conditions. A bilingual professional fluent in English and Hindi, Omith consistently demonstrates his analytical and collaborative problem-solving capabilities through hands-on data analysis projects, comprehensive FinTech case studies, and consecutive participation in the MVLU Hackathon for both 2025 and 2026.
          </p>

          {/* Vertical Left-Aligned Contact Block */}
          <div style={{ marginTop: 'auto', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', wordBreak: 'break-word' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Email:</strong>
              <a href="mailto:omiththilakancs242537@gmail.com" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.95rem' }}>omiththilakancs242537@gmail.com</a>
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Contact:</strong> 
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>+91 7306238385</span>
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>LinkedIn:</strong>
              <a href="https://www.linkedin.com/in/omith-thilakan-3916b43a4/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.95rem' }}>https://www.linkedin.com/in/omith-thilakan-3916b43a4/</a>
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>Portfolio:</strong>
              <a href="https://omith-portfolio.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.95rem' }}>https://omith-portfolio.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
