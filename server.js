const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/deals', require('./routes/dealRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/timeline', require('./routes/timelineRoutes'));

// Basic Route
app.get('/', (req, res) => {
  res.send('CRM API is running');
});

const http = require('http');
const socket = require('./utils/socket');

const server = http.createServer(app);

// Initialize Socket.io
socket.init(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
