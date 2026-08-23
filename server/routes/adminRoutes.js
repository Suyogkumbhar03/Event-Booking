const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    getAdminStats,
    getAdminBookings,
    toggleCheckIn,
    getEventsSummary
} = require('../controllers/adminController');

// All admin endpoints protected by JWT authentication
router.get('/stats', protect, getAdminStats);
router.get('/bookings', protect, getAdminBookings);
router.patch('/bookings/:bookingRef/check-in', protect, toggleCheckIn);
router.get('/events-summary', protect, getEventsSummary);

module.exports = router;
