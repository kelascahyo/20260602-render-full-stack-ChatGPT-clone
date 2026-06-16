import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const BACKEND_URL = 'https://two0260602-render-full-stack-chatgpt.onrender.com'; // Replace after deploying backend

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('chat_token') || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (token) setIsAuthenticated(true);
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('chat_token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error connecting to backend');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages([...updatedMessages, data.message]);
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Failed to send message.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <h2>Enter Secret Key</h2>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Your SECRET_KEY"
          />
          <button type="submit">Access Chat</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message-row ${msg.role}`}>
            <div className="message-box">
              <strong>{msg.role === 'user' ? 'You' : 'ChatGPT'}:</strong>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && <div className="message-row assistant"><div className="message-box">Thinking...</div></div>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="input-area">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type a message..." 
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}

export default App;
