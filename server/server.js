require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS Configuration for production
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:5174', // Alternative local port
  'https://taffys-best-bi.vercel.app/', // Your Vercel frontend
  process.env.CLIENT_URL // Any additional client URL from env
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
      console.log(`✓ Allowed origins:`, allowedOrigins);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'TWL System API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    allowedOrigins: allowedOrigins
  });
});
