import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Home from './Home';
import RegistrationForm from './components/RegistrationForm';
import CareerGuide from './CareerGuide';
import Roadmap from './Roadmap';
import AuthModal from './AuthModal';
import AboutUs from './AboutUs';
import Profile from './Profile';
import './index.css';

// --- NEW WHATSAPP SUPPORT COMPONENT ---
const WhatsAppSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Replace this with your actual WhatsApp number (include country code, e.g., 91 for India)
  const adminPhone = "918898732383"; 

  const handleSend = (type) => {
    const text = type === 'course' 
      ? "Hello Selvesh, I cant find [Course Name] Course in the Web can You please work on it"
      : "Hello Selvesh, I cant find [Field Name] Related Course and scholarships in the Web can You please work on it";
    
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="support-fab-container">
      {isOpen && (
        <div className="support-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Request a Missing Field</h4>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
            Can't find your domain? Send me a quick WhatsApp message and I'll add the resources!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="support-action-btn" onClick={() => handleSend('course')}>
              Missing Course 📚
            </button>
            <button className="support-action-btn" onClick={() => handleSend('field')}>
              Missing Field (e.g. Commerce/MBBS) 🎓
            </button>
          </div>
        </div>
      )}
      
      <button 
        className="support-fab-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Report Missing Course/Field"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState(null); 
  
  const [demandData, setDemandData] = useState([]);
  
  // Roadmap State
  const [savedCourses, setSavedCourses] = useState([]);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  // Load Roadmap from LocalStorage when a user logs in
  useEffect(() => {
    if (userEmail) {
      const localRoadmap = localStorage.getItem(`roadmap_${userEmail}`);
      if (localRoadmap) {
        setSavedCourses(JSON.parse(localRoadmap));
      } else {
        setSavedCourses([]);
      }
    }
  }, [userEmail]);

  // Save Roadmap to LocalStorage whenever it updates
  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(`roadmap_${userEmail}`, JSON.stringify(savedCourses));
    }
  }, [savedCourses, userEmail]);

  const fetchDemandTrends = async () => {
    try {
      const response = await axios.get('https://cep-pathguide-backend.onrender.com/api/demand-trends');
      setDemandData(response.data.trends || []);
    } catch (err) {
      console.error("Failed to load demand trends:", err);
    }
  };

  useEffect(() => {
    fetchDemandTrends();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleNavClick = (tab) => {
    if (!isLoggedIn && tab !== 'home' && tab !== 'about') {
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };

  const handleLoginSuccess = async (email) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setShowAuthModal(false); 
    
    try {
      const res = await axios.get(`https://cep-pathguide-backend.onrender.com/api/profile/${email}`);
      if (res.data.profile) {
        setUserProfile(res.data.profile);
      }
    } catch (err) {
      console.log("No existing profile found or error fetching.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setUserProfile(null);
    setActiveTab('home');
    setSavedCourses([]); // Clear roadmap from screen on logout
  };

  return (
    <div className="app-container">
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}

      <nav className="navbar">
        <div className="nav-content">
          
          <div className="nav-brand" onClick={() => setActiveTab('home')} style={{cursor: 'pointer'}}>
            <img 
              src="/logo.PNG" 
              alt="CEP Logo" 
              style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' }} 
            />
            <span className="nav-logo">CEP</span>
            <span className="nav-title">PathGuide</span>
          </div>

          <div className="mobile-controls">
            <button className="theme-toggle-btn mobile-only" onClick={toggleTheme}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
            </button>
          </div>

          <div className={`nav-buttons ${isMobileMenuOpen ? 'open' : ''}`}>
            <button onClick={() => handleNavClick('home')} className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}>
              Home & Demand
            </button>
            <button onClick={() => handleNavClick('user-window')} className={`nav-btn ${activeTab === 'user-window' ? 'active' : ''}`}>
              Find Opportunities
            </button>
            <button onClick={() => handleNavClick('career-guidance')} className={`nav-btn ${activeTab === 'career-guidance' ? 'active' : ''}`}>
              AI Career Guide
            </button>
            <button onClick={() => handleNavClick('roadmap')} className={`nav-btn ${activeTab === 'roadmap' ? 'active' : ''}`}>
              Roadmap & Progress
            </button>
            <button onClick={() => handleNavClick('about')} className={`nav-btn ${activeTab === 'about' ? 'active' : ''}`}>
              About Us
            </button>

            {isLoggedIn && (
              <button onClick={() => handleNavClick('profile')} className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                ⚙️ Profile
              </button>
            )}

            <div className="nav-auth-wrapper">
              {!isLoggedIn ? (
                <button onClick={() => setShowAuthModal(true)} className="nav-btn login-btn">
                  Login / Register
                </button>
              ) : (
                <button onClick={handleLogout} className="nav-btn logout-btn">
                  Logout
                </button>
              )}
            </div>
            <button className="theme-toggle-btn desktop-only" onClick={toggleTheme}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'home' && <Home onExplore={() => handleNavClick('user-window')} demandData={demandData} />}
        {activeTab === 'about' && <AboutUs />}
        
        {activeTab === 'profile' && (
          <Profile userEmail={userEmail} userProfile={userProfile} setUserProfile={setUserProfile} />
        )}

        {activeTab === 'user-window' && (
          <RegistrationForm
            userProfile={userProfile}
            onEnroll={(course) => {
              if (!savedCourses.some((c) => c.title === course.name)) {
                setSavedCourses([...savedCourses, { 
                  id: Date.now(), 
                  title: course.name, 
                  provider: course.provider, 
                  totalModules: 8, 
                  completedModules: 0,
                  achievements: [] 
                }]);
                alert(`Added "${course.name}" to your Roadmap!`);
              } else {
                alert(`"${course.name}" is already in your Roadmap.`);
              }
            }}
            onSearchCompleted={fetchDemandTrends}
          />
        )}

        {activeTab === 'career-guidance' && (
          <CareerGuide 
            onEnroll={(courseName) => {
              if (!savedCourses.some((c) => c.title === courseName)) {
                setSavedCourses([...savedCourses, { 
                  id: Date.now(), 
                  title: courseName, 
                  provider: "AI Recommendation", 
                  totalModules: 8, 
                  completedModules: 0,
                  achievements: []
                }]);
                alert(`Added "${courseName}" to your Roadmap!`);
              } else {
                alert(`"${courseName}" is already in your Roadmap.`);
              }
            }}
          />
        )}

        {activeTab === 'roadmap' && <Roadmap courses={savedCourses} setCourses={setSavedCourses} />}
      </main>

      {/* RENDER THE FLOATING SUPPORT WIDGET GLOBALLY */}
      <WhatsAppSupport />

    </div>
  );
};

export default App;
