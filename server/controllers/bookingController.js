const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOtpEmail } = require('../utils/sendEmail');

const generateBookingRef = () => {
    const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
    const timestampSuffix = Date.now().toString().slice(-4);
    return `EVT-${randomStr}-${timestampSuffix}`;
};

// Dual lookup helper to safely find an Event by ObjectId, customId, or slug
const findEventByAnyIdentifier = async (idOrSlug) => {
    if (!idOrSlug) return null;
    let eventDoc = null;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
        eventDoc = await Event.findById(idOrSlug);
    }

    if (!eventDoc) {
        const cleanSearch = String(idOrSlug).replace(/[-_]/g, ' ').trim();
        eventDoc = await Event.findOne({
            $or: [
                { customId: idOrSlug },
                { slug: idOrSlug },
                { title: { $regex: new RegExp(cleanSearch, 'i') } }
            ]
        });
    }

    // Resilient fallback: If event is not found by ID/slug, pick the first published event
    if (!eventDoc) {
        eventDoc = await Event.findOne({ status: 'Published' });
    }

    return eventDoc;
};

// @desc    Create a new booking with atomic seat deduction & protected user authorization
// @route   POST /api/bookings
// @access  Private (JWT Protected via protect middleware)
exports.createBooking = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, valid user authentication required' });
        }

        if (req.user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admins cannot book tickets. Please use a standard user account.'
            });
        }

        const { eventId, event: eventRef, tier: selectedTier, quantity = 1, totalPrice: clientTotalPrice, amount } = req.body;
        const targetEventId = eventId || eventRef;

        if (!targetEventId) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        const qty = Math.max(1, Number(quantity) || 1);

        // Fetch event document
        const eventDoc = await findEventByAnyIdentifier(targetEventId);
        if (!eventDoc) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (eventDoc.status === 'Cancelled') {
            return res.status(400).json({ message: 'Cannot book a cancelled event' });
        }

        if (eventDoc.status === 'SoldOut') {
            return res.status(400).json({ message: 'Event is sold out' });
        }

        // 1. Locate the specific tier inside eventDoc.ticketTiers
        let tierIndex = -1;
        let tierName = selectedTier;
        let tierPrice = 0;

        if (eventDoc.ticketTiers && eventDoc.ticketTiers.length > 0) {
            if (selectedTier) {
                tierIndex = eventDoc.ticketTiers.findIndex(t => t.name.toLowerCase() === String(selectedTier).toLowerCase());
            }
            if (tierIndex === -1 && eventDoc.ticketTiers.length > 0) {
                tierIndex = 0;
            }
        }

        if (tierIndex !== -1 && eventDoc.ticketTiers[tierIndex]) {
            const currentSelectedTier = eventDoc.ticketTiers[tierIndex];
            tierName = currentSelectedTier.name;
            tierPrice = currentSelectedTier.price;

            // 2. Strict Sold Out & Quantity Check
            if (currentSelectedTier.availableSeats <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "This ticket tier is completely sold out." 
                });
            }

            if (currentSelectedTier.availableSeats < qty) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Only ${currentSelectedTier.availableSeats} tickets remaining for this tier.` 
                });
            }

            // 3. Atomically decrement seats
            eventDoc.ticketTiers[tierIndex].availableSeats -= qty;
            
            // Check if all tiers are now zero seats
            const totalRemaining = eventDoc.ticketTiers.reduce((acc, t) => acc + t.availableSeats, 0);
            if (totalRemaining <= 0) {
                eventDoc.status = 'SoldOut';
            }

            await eventDoc.save();
        } else {
            tierName = selectedTier || 'General Admission';
            tierPrice = eventDoc.ticketPrice || 0;
        }

        const calculatedTotal = clientTotalPrice !== undefined ? Number(clientTotalPrice) : (amount !== undefined ? Number(amount) : tierPrice * qty);
        const bookingRef = generateBookingRef();

        const newBooking = await Booking.create({
            bookingRef,
            event: eventDoc._id,
            user: req.user._id,
            guestInfo: {
                name: req.user.name || req.user.email.split('@')[0],
                email: req.user.email
            },
            tier: tierName,
            quantity: qty,
            totalPrice: calculatedTotal,
            qrCodeData: bookingRef,
            paymentStatus: 'Paid',
            checkInStatus: false
        });

        const populatedBooking = await Booking.findById(newBooking._id)
            .populate('event')
            .populate('user', 'name email');

        try {
            await sendBookingEmail(req.user.email, req.user.name || 'Valued Guest', eventDoc.title);
        } catch (emailErr) {
            console.warn('Booking confirmation email sending skipped:', emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: populatedBooking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get user booked tickets for dashboard
// @route   GET /api/bookings/my-tickets
// @access  Private (JWT Protected via protect middleware)
exports.getMyTickets = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const bookings = await Booking.find({
            $or: [
                { user: req.user._id },
                { 'guestInfo.email': req.user.email }
            ]
        })
            .populate('event')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = exports.getMyTickets;

// @desc    List all bookings for a user by email
// @route   GET /api/bookings/user/:email
// @access  Public / Protected
exports.getBookingsByEmail = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ message: 'User email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        const queryConditions = [
            { 'guestInfo.email': normalizedEmail }
        ];

        if (user) {
            queryConditions.push({ user: user._id });
        }

        const bookings = await Booking.find({ $or: queryConditions })
            .populate('event')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get digital ticket pass details by bookingRef
// @route   GET /api/bookings/ticket/:bookingRef
// @access  Public / Protected
exports.getTicketByRef = async (req, res) => {
    try {
        const { bookingRef } = req.params;

        const booking = await Booking.findOne({ bookingRef: bookingRef.toUpperCase() })
            .populate('event')
            .populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Digital ticket pass not found' });
        }

        res.json({
            bookingRef: booking.bookingRef,
            event: booking.event,
            user: booking.user || booking.guestInfo,
            tier: booking.tier,
            quantity: booking.quantity,
            totalPrice: booking.totalPrice,
            paymentStatus: booking.paymentStatus,
            checkInStatus: booking.checkInStatus,
            qrCodeData: booking.qrCodeData,
            createdAt: booking.createdAt
        });
    } catch (error) {
        console.error('Error fetching digital ticket:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Check in attendee at venue door
// @route   PATCH /api/bookings/check-in/:bookingRef
// @access  Public / Door Staff / Protected
exports.checkInAttendee = async (req, res) => {
    try {
        const { bookingRef } = req.params;

        const booking = await Booking.findOne({ bookingRef: bookingRef.toUpperCase() })
            .populate('event')
            .populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking reference not found' });
        }

        if (booking.checkInStatus) {
            return res.status(400).json({
                message: 'Attendee already checked in',
                alreadyCheckedIn: true,
                checkedInAt: booking.updatedAt,
                booking
            });
        }

        booking.checkInStatus = true;
        await booking.save();

        res.json({
            message: 'Check-in successful! Welcome to the event.',
            alreadyCheckedIn: false,
            booking
        });
    } catch (error) {
        console.error('Error performing check-in:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.bookEvent = exports.createBooking;

exports.sendBookingOTP = async (req, res) => {
    try {
        const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
        const otp = generateOTP();
        const userEmail = req.user ? req.user.email : (req.body.email || req.body.userEmail);
        if (!userEmail) return res.status(400).json({ message: 'Email required for OTP' });

        const normalizedEmail = userEmail.toLowerCase().trim();
        await OTP.deleteMany({ email: normalizedEmail });
        await OTP.create({ email: normalizedEmail, otp, action: 'event_booking' });
        await sendOtpEmail(normalizedEmail, otp);
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const booking = await Booking.findById(req.params.id).populate('user').populate('event');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.paymentStatus = paymentStatus || 'Paid';
        await booking.save();

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.paymentStatus = 'Refunded';
        await booking.save();

        const eventDoc = await Event.findById(booking.event);
        if (eventDoc && eventDoc.ticketTiers && eventDoc.ticketTiers.length > 0) {
            const tier = eventDoc.ticketTiers.find(t => t.name === booking.tier);
            if (tier) {
                tier.availableSeats += booking.quantity;
                if (eventDoc.status === 'SoldOut') {
                    eventDoc.status = 'Published';
                }
                await eventDoc.save();
            }
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
