import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const initialWelcomeMessage = {
  role: 'ai',
  content: `### Welcome to Path Guide's Digital Career Navigator 🚀
I am your AI Career & Financial Aid Advisor powered by Groq LPU & RAG.

**How I can assist you today:**
- 📊 **Compare Domains**: Compare career trajectories (e.g., *Data Engineer vs ML Engineer in India*).
- 🛣️ **Generate Flowchart Roadmaps**: Get step-by-step milestones with structured tables and tech stacks.
- 🎓 **RAG Recommendations**: Every answer automatically searches our database for live **scholarships & verified courses** tailored to your prompt.`,
};

const CareerGuide = () => {
  // 1. Initialize state from LocalStorage to permanently save chats across tab switches & reloads
  const [sessions, setSessions] = useState(() => {
    const savedSessions = localStorage.getItem('aiChatSessions');
    if (savedSessions) {
      try {
        return JSON.parse(savedSessions);
      } catch (err) {
        console.error("Failed to parse saved chats", err);
      }
    }
    return [{ id: Date.now(), name: 'New Conversation', messages: [initialWelcomeMessage] }];
  });

  // 2. Load the last active chat ID from LocalStorage
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const savedActiveId = localStorage.getItem('aiActiveSessionId');
    if (savedActiveId) {
      try {
        return JSON.parse(savedActiveId);
      } catch (err) {
        console.error("Failed to parse active ID", err);
      }
    }
    // Fallback if no saved ID exists
    const fallbackId = localStorage.getItem('aiChatSessions') 
      ? JSON.parse(localStorage.getItem('aiChatSessions'))[0]?.id 
      : Date.now();
    return fallbackId;
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Guarantee we always have an active session to render
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // 3. Auto-save to LocalStorage whenever sessions or active tab changes
  useEffect(() => {
    localStorage.setItem('aiChatSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('aiActiveSessionId', JSON.stringify(activeSessionId));
  }, [activeSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, loading]);

  const handleNewChat = () => {
    const newId = Date.now();
    setSessions(prev => [
      { id: newId, name: 'New Conversation', messages: [initialWelcomeMessage] },
      ...prev
    ]);
    setActiveSessionId(newId);
  };

  const handleDeleteChat = (e, idToDelete) => {
    e.stopPropagation(); // Prevent clicking the delete button from triggering the chat selection
    const updatedSessions = sessions.filter(s => s.id !== idToDelete);
    
    // If we deleted the last chat, create a brand new one automatically
    if (updatedSessions.length === 0) {
      const newSession = { id: Date.now(), name: 'New Conversation', messages: [initialWelcomeMessage] };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    } else {
      setSessions(updatedSessions);
      // If we deleted the currently active chat, switch to the next available one
      if (activeSessionId === idToDelete) {
        setActiveSessionId(updatedSessions[0].id);
      }
    }
  };

  const updateSessionMessages = (sessionId, newMessages, newName = null) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: newMessages, name: newName || s.name };
      }
      return s;
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const currentInput = input;
    
    // Automatically name the chat if it's the first user message
    const updatedName = activeSession.messages.length === 1 ? currentInput.substring(0, 25) + '...' : activeSession.name;
    const newMessages = [...activeSession.messages, userMessage];
    
    updateSessionMessages(activeSessionId, newMessages, updatedName);
    setInput('');
    setLoading(true);

    try {
      // Pass chat history context to backend (exclude the current input from history payload)
      const historyPayload = activeSession.messages.map(m => ({ role: m.role, content: m.content }));

      const response = await axios.post('http://localhost:8000/api/career-guidance', {
        prompt: currentInput,
        history: historyPayload
      });

      updateSessionMessages(activeSessionId, [
        ...newMessages,
        { role: 'ai', content: response.data.reply || 'No response returned.' }
      ]);
    } catch (err) {
      updateSessionMessages(activeSessionId, [
        ...newMessages,
        { role: 'ai', content: 'Connection error. Please ensure your FastAPI server is running.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!activeSession) return null; // Failsafe during rapid state hydration

  return (
    <div className="fullscreen-chat" style={{ display: 'flex', flexDirection: 'row' }}>
      
      {/* Sidebar: Chat History */}
      <div className="chat-sidebar desktop-only" style={{ width: '280px', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            onClick={handleNewChat} 
            className="primary-btn" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <span>+</span> New Conversation
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Saved Chats
          </p>
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => setActiveSessionId(s.id)} 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem', 
                margin: '0.35rem 0', 
                cursor: 'pointer', 
                borderRadius: 'var(--radius-sm)', 
                backgroundColor: activeSessionId === s.id ? 'var(--primary-light)' : 'transparent', 
                border: activeSessionId === s.id ? '1px solid var(--border-focus)' : '1px solid transparent',
                color: activeSessionId === s.id ? 'var(--primary-color)' : 'var(--text-secondary)', 
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                fontWeight: activeSessionId === s.id ? '600' : '500', 
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1
              }}>
                💬 {s.name}
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, s.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--danger-color)',
                  cursor: 'pointer',
                  opacity: activeSessionId === s.id ? 1 : 0.5,
                  padding: '0.2rem',
                  fontSize: '0.9rem',
                  marginLeft: '0.5rem'
                }}
                title="Delete Chat"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2>Path Guide Navigator</h2>
              <p>Real-time AI advising with Context Memory & RAG Search</p>
            </div>
            <span className="rag-pill-badge">⚡ RAG Database Active</span>
          </div>
        </div>

        <div className="chat-history">
          {activeSession.messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className={`message-bubble ${msg.role === 'ai' ? 'markdown-body' : ''}`}>
                {msg.role === 'ai' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-row ai">
              <div className="message-bubble loading-pulse">
                🔍 Analyzing context & Querying MongoDB Database...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question (e.g. Compare Data Science vs Cybersecurity and suggest scholarships...)"
            className="chat-input"
          />
          <button type="submit" className="chat-send-btn" disabled={loading}>
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CareerGuide;