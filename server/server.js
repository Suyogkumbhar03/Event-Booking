const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Initialize Mongoose Database Connection
connectDB();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production' || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            callback(null, true); // Allow for mobile / vercel previews
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route & Health Check Endpoint
app.get('/', (req, res) => {
    res.send('🚀 Eventora Backend API is running on Render!');
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Eventora Event Booking API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes (supports /api/*, /*, and defensive /api/api/* endpoints for 100% route safety)
app.use(['/api/auth', '/auth', '/api/api/auth'], authRoutes);
app.use(['/api/events', '/events', '/api/api/events'], eventRoutes);
app.use(['/api/bookings', '/bookings', '/api/api/bookings'], bookingRoutes);
app.use(['/api/admin', '/admin', '/api/api/admin'], adminRoutes);

// Global 404 Route Handler
app.use((req, res, next) => {
    res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Eventora Server running on port ${PORT}`);
});

module.exports = app;
