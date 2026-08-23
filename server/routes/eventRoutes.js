const express = require('express');
const router = express.Router();
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/auth');

// GET /api/events (Search & Filter)
router.get('/', getEvents);

// GET /api/events/:id (Single Event details with tier availability)
router.get('/:id', getEventById);

// POST /api/events (Create Event - Admin/Organizer)
router.post('/', protect, admin, createEvent);

// PUT /api/events/:id (Update Event details)
router.put('/:id', protect, admin, updateEvent);

// DELETE /api/events/:id (Delete or Cancel Event)
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;
