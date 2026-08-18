const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');

const { pool } = require('./db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

// Dynamic CORS configuration for multi-domain support (e.g. Railway)
const getCorsOrigins = () => {
  const defaultClient = 'http://localhost:5173';
  const origins = [];
  
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach(u => {
      const clean = u.trim().replace(/\/$/, '');
      if (clean && !origins.includes(clean)) origins.push(clean);
    });
  } else {
    origins.push(defaultClient);
  }

  if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach(u => {
      const clean = u.trim().replace(/\/$/, '');
      if (clean && !origins.includes(clean)) origins.push(clean);
    });
  }

  return origins;
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = getCorsOrigins();
    if (!origin || allowed.includes(origin) || allowed.includes('*') || !isProduction) {
      callback(null, true);
    } else if (allowed.some(a => origin.startsWith(a))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow Railway preview domains
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});
app.set('io', io);

// Socket.IO Room management
io.on('connection', (socket) => {
  socket.on('join_community', (communityId) => {
    if (communityId) {
      socket.join(`community_${communityId}`);
    }
  });

  socket.on('leave_community', (communityId) => {
    if (communityId) {
      socket.leave(`community_${communityId}`);
    }
  });

  socket.on('typing', ({ communityId, userName }) => {
    if (communityId) {
      socket.to(`community_${communityId}`).emit('user_typing', { communityId, userName });
    }
  });
});

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

if (!isProduction) {
  app.use(morgan('dev'));
}

app.use(cors(corsOptions));

// Static files for uploaded avatars and persistent media (supports Railway Persistent Volume via UPLOADS_DIR)
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'davra_production_super_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/communities/:id/messages', require('./routes/messages'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/events', require('./routes/events'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/site-settings', require('./routes/siteSettings'));

app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/communities', require('./routes/adminCommunities'));
app.use('/api/admin/admins', require('./routes/adminAdmins'));
app.use('/api/admin/settings', require('./routes/adminSettings'));
app.use('/api/admin', require('./routes/adminAuditLogs'));

app.use((req, res, next) => {
  res.status(404).json({ error: true, message: "So'ralgan resurs topilmadi." });
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Davra server va Real-time Chat ${HOST}:${PORT} portda muvaffaqiyatli ishga tushdi.`);
});

module.exports = { app, server, io };
