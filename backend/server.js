import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware to protect your API using your SECRET_KEY via a JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Optional: A login route to grant a token if the user knows the SECRET_KEY
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === SECRET_KEY) {
    const token = jwt.sign({ access: true }, SECRET_KEY, { expiresIn: '7d' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid secret key' });
});

// Chat endpoint
app.post('/api/chat', authenticateToken, async (req, res) => {
  const { messages } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
    });

    res.json({ message: response.choices[0].message });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to communicate with OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
