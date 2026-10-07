import React from 'react';

const AboutUs = () => {
  return (
    <div className="home-container" style={{ gap: '2rem' }}>
      <section className="hero-section" style={{ paddingBottom: '1rem' }}>
        <h1 className="hero-title">About Our Platform</h1>
        <p className="hero-subtitle">
          Welcome to the PathGuide Platform. This project is dedicated to providing students with AI-driven, 
          personalized career guidance. By leveraging machine learning, we map your academic background, financial needs, 
          and career interests directly to scholarships, roadmap courses, and real-time industry demand—helping you navigate 
          the complex transition from education to a successful career.
        </p>
      </section>

      <section className="cards-grid">
        <div className="card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 className="demand-header h3" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', borderBottom: 'none' }}>
              Selvesh Sathiyaseelan Nadar
            </h2>
            <p style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Student at Sheth L.U.J. and Sir M.V. College,Web Developer of PathGuide Platform</p>
          </div>
          
          <div className="synopsis-list">
            <p><strong>Bio:</strong> Selvesh is a B.Sc. Computer Science student with a strong interest in Artificial Intelligence, Machine Learning, Web Development, Software Development and Data Analytics. He is serving as an Instructor Assistant for Data Viusalization with Tableau Course at Rock The IT, supporting students in their learning and practical activities. He is also focused on building practical projects using Python, React, JavaScript, databases, and APIs to develop useful technology solutions.Selvesh also serves as DLLE (Department of life long extension) Student Manager in his college since last acedemic year.</p>
            <p><strong>Email:</strong> nadarselveshcs242534@gmail.com</p>
            <p><strong>Contact:</strong> +91 8898732383</p>
            <p><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/selvesh-nadar" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>https://www.linkedin.com/in/selvesh-nadar</a></p>
            <p><strong>Portfolio:</strong> <a href="https://aboutselveshsathiyaseelannadar.netlify.app/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>https://aboutselveshsathiyaseelannadar.netlify.app/</a></p>
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 className="demand-header h3" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', borderBottom: 'none' }}>
              Omith Thilakan
            </h2>
            <p style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Student at Sheth L.U.J. and Sir M.V. College, Data Miner,Survery collector of PathGuide Platform</p>
          </div>
          
          <div className="synopsis-list">
            <p><strong>Bio:</strong> Omith Thilakan is a dedicated third-year B.Sc. Computer Science (TYCS) student based in Mumbai, Maharashtra. Currently enrolled at Sheth L.U.J. and Sir M.V. College, he possesses robust technical expertise spanning Python, Java, Node.js, Database Management, and cyber security. Complementing a specialized background in AI Prompt Engineering, Omith actively cultivates a strong interest in academic and technological research. He authored a study titled "Comparative Analysis of ARIMA and LSTM for Gold Price Prediction", which investigated modern financial forecasting methodologies, demonstrating that deep learning LSTM networks improve prediction accuracy by up to 37.78% over traditional ARIMA models under volatile market conditions. A bilingual professional fluent in English and Hindi, Omith consistently demonstrates his analytical and collaborative problem-solving capabilities through hands-on data analysis projects, comprehensive FinTech case studies, and consecutive participation in the MVLU Hackathon for both 2025 and 2026.</p>
            <p><strong>Email:</strong> omiththilakancs242537@gmail.com</p>
            <p><strong>Contact:</strong> +91 7306238385</p>
            <p><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/omith-thilakan" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>https://www.linkedin.com/in/omith-thilakan</a></p>
            <p><strong>Portfolio:</strong> <a href="#" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>[Insert Portfolio Link Placeholder]</a></p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
