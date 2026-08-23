const express = require('express');
const router = express.Router();
const {
    createBooking,
    getMyTickets,
    getBookingsByEmail,
    getTicketByRef,
    checkInAttendee,
    sendBookingOTP,
    confirmBooking,
    getMyBookings,
    cancelBooking
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

// POST /api/bookings (Protected by JWT)
router.post('/', protect, createBooking);

// GET /api/bookings/my-tickets (Protected - fetch user tickets for dashboard)
router.get('/my-tickets', protect, getMyTickets);

// GET /api/bookings/my (Protected alias for my-tickets)
router.get('/my', protect, getMyBookings);

// GET /api/bookings/user/:email (List all bookings for a user by email)
router.get('/user/:email', getBookingsByEmail);

// GET /api/bookings/ticket/:bookingRef (Public/Protected digital ticket pass lookup)
router.get('/ticket/:bookingRef', getTicketByRef);

// PATCH /api/bookings/check-in/:bookingRef (Check in attendee at venue door)
router.patch('/check-in/:bookingRef', checkInAttendee);

// Send booking verification OTP (Public / Optional Auth)
router.post('/send-otp', sendBookingOTP);

// Protected routes
router.put('/:id/confirm', protect, admin, confirmBooking);
router.delete('/:id', protect, cancelBooking);

module.exports = router;
