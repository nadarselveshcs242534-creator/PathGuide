import React, { useState } from 'react';
import axios from 'axios';

const Roadmap = ({ courses, setCourses }) => {
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalFeedback, setEvalFeedback] = useState(null);

  // New function to handle roadmap deletion safely
  const handleDeleteCourse = (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from your roadmap? This action cannot be undone.`)) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
      
      // Close the evaluator if the user deletes the course they are currently evaluating
      if (activeCourseId === id) {
        setActiveCourseId(null);
        setEvalFeedback(null);
        setUserAnswer('');
      }
    }
  };

  const handleEvaluate = async (course) => {
    if (!userAnswer.trim() || evaluating) return;
    setEvaluating(true);
    setEvalFeedback(null);

    try {
      const response = await axios.post('http://localhost:8000/api/roadmap-eval', {
        courseTitle: course.title,
        currentModule: course.completedModules + 1,
        totalModules: course.totalModules,
        userAnswer: userAnswer,
      });

      const result = response.data;
      setEvalFeedback(result);

      if (result.passed) {
        const increment = parseInt(result.modulesToAdd) || 1;
        
        setCourses((prev) =>
          prev.map((c) => {
            if (c.id === course.id) {
              const startMod = c.completedModules + 1;
              const newCount = Math.min(c.completedModules + increment, c.totalModules);
              const endMod = newCount;
              
              // Smart formatting: if jumping multiple modules, show "M1-M4" instead of just "M1"
              const modLabel = startMod === endMod ? `M${startMod}` : `M${startMod}-M${endMod}`;

              const newAchievement = {
                moduleNum: modLabel,
                skill: result.skillVerified || "Verified Milestone",
                detail: userAnswer
              };
              
              return {
                ...c,
                completedModules: newCount,
                achievements: [...(c.achievements || []), newAchievement]
              };
            }
            return c;
          })
        );
      }
      setUserAnswer('');
    } catch (err) {
      console.error('Roadmap Evaluation Error:', err);
      alert('Failed to connect to AI evaluator. Please ensure your backend is online.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleManualIncrement = (id) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === id && c.completedModules < c.totalModules) {
          const nextCount = c.completedModules + 1;
          const newAchievement = {
            moduleNum: `M${nextCount}`,
            skill: "Manual Verification",
            detail: "Self-certified module completion."
          };
          return {
            ...c,
            completedModules: nextCount,
            achievements: [...(c.achievements || []), newAchievement]
          };
        }
        return c;
      })
    );
  };

  const handleManualDecrement = (id) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === id && c.completedModules > 0) {
          const updatedAchievements = [...(c.achievements || [])];
          updatedAchievements.pop();
          return {
            ...c,
            completedModules: c.completedModules - 1,
            achievements: updatedAchievements
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <h2>Your Skill Roadmaps & AI Progress Tracker</h2>
        <p>Monitor your course completion milestones or verify your learning against real course syllabi using RAG.</p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-roadmap">
          <h3>No Courses Enrolled Yet</h3>
          <p>Explore opportunities in the <strong>Find Opportunities</strong> or <strong>AI Career Guide</strong> tabs and click "+ Add to Roadmap".</p>
        </div>
      ) : (
        <div className="roadmap-list">
          {courses.map((course) => {
            const progressPercent = Math.round(
              (course.completedModules / course.totalModules) * 100
            );

            return (
              <div key={course.id} className="roadmap-card">
                <div className="roadmap-card-header" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-provider">Platform: {course.provider}</p>
                  </div>
                  
                  {/* Delete Button & Percentage */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <span className="percent-label">{progressPercent}% Completed</span>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger-color)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0',
                        opacity: 0.8,
                        transition: 'opacity var(--transition-fast)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                      onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
                      title={`Remove ${course.title} from Roadmap`}
                    >
                      🗑️ Remove Roadmap
                    </button>
                  </div>
                </div>

                <div className="progress-track" style={{ margin: '1.25rem 0' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: progressPercent === 100 ? 'var(--success-color)' : 'var(--primary-color)',
                    }}
                  />
                </div>

                {/* DYNAMIC ROADMAP MILESTONES */}
                {course.achievements && course.achievements.length > 0 && (
                  <div className="roadmap-skills-panel">
                    <h4 className="skills-panel-title">🎯 Verified Skills & Milestones:</h4>
                    <div className="skills-tags-wrap">
                      {course.achievements.map((ach, idx) => {
                        // Support both old string achievements and new object achievements
                        const skillLabel = typeof ach === 'object' ? ach.skill : ach;
                        const detailText = typeof ach === 'object' ? ach.detail : null;
                        const modLabel = typeof ach === 'object' ? ach.moduleNum : `M${idx + 1}`;
                        
                        return (
                          <div key={idx} className="skill-milestone-pill" title={detailText || ''}>
                            <span className="pill-dot">✓</span>
                            <span><strong>{modLabel}:</strong> {skillLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="roadmap-controls">
                  <span>
                    Modules Passed: <strong>{course.completedModules}</strong> / {course.totalModules}
                  </span>

                  <div className="btn-group">
                    <button
                      className="nav-btn"
                      onClick={() => handleManualDecrement(course.id)}
                      disabled={course.completedModules === 0}
                      title="Decrement module"
                    >
                      -
                    </button>
                    <button
                      className="nav-btn"
                      onClick={() => handleManualIncrement(course.id)}
                      disabled={course.completedModules === course.totalModules}
                      title="Increment module"
                    >
                      +
                    </button>
                    <button
                      className="primary-btn"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => {
                        setActiveCourseId(activeCourseId === course.id ? null : course.id);
                        setEvalFeedback(null);
                        setUserAnswer('');
                      }}
                    >
                      {activeCourseId === course.id ? 'Close AI Evaluator' : '🤖 Assess Progress with AI'}
                    </button>
                  </div>
                </div>

                {/* LIQUID GLASS AI INTERACTIVE PROGRESS WORKSPACE */}
                {activeCourseId === course.id && (
                  <div className="roadmap-evaluator-card">
                    <div className="evaluator-card-header">
                      <div>
                        <h4>🤖 RAG Milestone Assessment — Module {Math.min(course.completedModules + 1, course.totalModules)}</h4>
                        <p>Explain the specific concepts, methods, or tools you explored. The AI checks your submission directly against the verified course database.</p>
                      </div>
                      <span className="rag-verified-badge">📚 Verified Database Curriculum</span>
                    </div>

                    <div className="evaluator-input-container">
                      <textarea
                        className="evaluator-textarea"
                        rows={4}
                        placeholder={`e.g., In this module for ${course.title}, I learned how to build interactive dashboards, configure chart types, format color legends, and calculate custom KPIs...`}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={evaluating}
                      />
                    </div>

                    <div className="evaluator-actions">
                      <button
                        className="submit-btn evaluator-submit-btn"
                        onClick={() => handleEvaluate(course)}
                        disabled={evaluating || !userAnswer.trim()}
                      >
                        {evaluating ? 'Analyzing against Course Database...' : 'Verify Module & Advance Roadmap →'}
                      </button>
                    </div>

                    {evalFeedback && (
                      <div className={`eval-feedback-box ${evalFeedback.passed ? 'success' : 'warning'}`}>
                        <div className="feedback-status-row">
                          <span className="status-badge">
                            {evalFeedback.passed ? `✅ Verified: ${evalFeedback.skillVerified}` : '💡 Needs Revision'}
                          </span>
                          {evalFeedback.passed && (
                            <span className="modules-advanced-pill">+{evalFeedback.modulesToAdd || 1} Module(s)</span>
                          )}
                        </div>
                        <p className="feedback-body-text">{evalFeedback.feedback}</p>
                        {evalFeedback.nextQuestion && (
                          <div className="feedback-next-challenge">
                            <span className="challenge-label">🎯 Next Curriculum Milestone:</span>
                            <p>{evalFeedback.nextQuestion}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Roadmap;