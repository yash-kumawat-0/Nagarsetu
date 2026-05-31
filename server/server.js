const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const seedDepartments = require('./src/config/seedDepartments');

// Load environment variables FIRST before anything else
dotenv.config();

// ─── Required Environment Variable Check ─────────────────────
// Fail fast with a clear error if critical vars are missing.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('   Set them in your Render dashboard → Environment section.');
  process.exit(1);
}

// ─── CORS Configuration ───────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,      // Production Vercel URL
  'http://localhost:5173',         // Vite dev default
  'http://localhost:5174',         // Vite dev alt
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow no-origin requests (Render health checks, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ─── App Setup ────────────────────────────────────────────────
const app = express();

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Security Headers ─────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',          require('./src/routes/authRoutes'));
app.use('/api/complaints',    require('./src/routes/complaintRoutes'));
app.use('/api/admin',         require('./src/routes/adminRoutes'));
app.use('/api/officer',       require('./src/routes/officerRoutes'));
app.use('/api/comments',      require('./src/routes/commentRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NagarSetu API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Start: Listen first, then connect DB ────────────────────
// Render requires the process to bind to PORT quickly.
// DB connection happens after the server is already listening.
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 NagarSetu Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ') || 'localhost only'}`);

  // Connect to MongoDB after server is up
  await connectDB();
  await seedDepartments();
});
