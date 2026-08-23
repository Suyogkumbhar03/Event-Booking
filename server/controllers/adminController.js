const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Get dashboard high-level statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
    try {
        const bookings = await Booking.find({});
        const activeEventsCount = await Event.countDocuments({ status: { $ne: 'Cancelled' } });
        
        let totalRevenue = 0;
        let totalTicketsSold = 0;
        let checkedInCount = 0;

        const attendeeEmailSet = new Set();

        bookings.forEach((b) => {
            if (b.paymentStatus === 'Paid') {
                totalRevenue += (b.totalPrice || 0);
                totalTicketsSold += (b.quantity || 1);
            }

            if (b.checkInStatus) {
                checkedInCount += (b.quantity || 1);
            }

            const email = b.guestInfo?.email || (b.user && b.user.email);
            if (email) {
                attendeeEmailSet.add(email.toLowerCase().trim());
            }
        });

        const registeredUsersCount = await User.countDocuments({});
        const totalAttendees = Math.max(attendeeEmailSet.size, registeredUsersCount);
        const checkInRate = totalTicketsSold > 0 ? Math.round((checkedInCount / totalTicketsSold) * 100) : 0;

        const recentSales = await Booking.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('event', 'title venue date bannerImage customId')
            .populate('user', 'name email');

        res.status(200).json({
            success: true,
            totalRevenue,
            totalTicketsSold,
            activeEventsCount,
            totalAttendees,
            checkInRate,
            recentSales
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admin stats', error: error.message });
    }
};

// @desc    Get paginated & filtered audit roster of bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAdminBookings = async (req, res) => {
    try {
        const { eventId, search, status, page = 1, limit = 20 } = req.query;

        const query = {};

        if (eventId) {
            query.event = eventId;
        }

        if (status) {
            if (status === 'checked-in') query.checkInStatus = true;
            else if (status === 'pending') query.checkInStatus = false;
            else if (['Paid', 'Pending', 'Refunded'].includes(status)) query.paymentStatus = status;
        }

        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { bookingRef: searchRegex },
                { 'guestInfo.name': searchRegex },
                { 'guestInfo.email': searchRegex }
            ];
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const totalBookings = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('event', 'title venue date ticketPrice ticketTiers customId')
            .populate('user', 'name email');

        res.status(200).json({
            success: true,
            totalBookings,
            totalPages: Math.ceil(totalBookings / limitNum),
            currentPage: pageNum,
            bookings
        });
    } catch (error) {
        console.error('Error fetching admin bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admin bookings', error: error.message });
    }
};

// @desc    Toggle door check-in status for an attendee ticket
// @route   PATCH /api/admin/bookings/:bookingRef/check-in
// @access  Private/Admin
exports.toggleCheckIn = async (req, res) => {
    try {
        const { bookingRef } = req.params;
        const cleanRef = String(bookingRef).trim().toUpperCase();

        let booking = await Booking.findOne({ 
            $or: [
                { bookingRef: cleanRef },
                { bookingRef: new RegExp(`^${cleanRef}$`, 'i') }
            ] 
        }).populate('event', 'title venue date').populate('user', 'name email');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking reference record not found' });
        }

        // Toggle checkInStatus or explicitly set if provided in body
        if (typeof req.body.checkInStatus === 'boolean') {
            booking.checkInStatus = req.body.checkInStatus;
        } else {
            booking.checkInStatus = !booking.checkInStatus;
        }

        await booking.save();

        res.status(200).json({
            success: true,
            message: `Door check-in updated to ${booking.checkInStatus ? 'CHECKED IN' : 'PENDING'}`,
            booking
        });
    } catch (error) {
        console.error('Error toggling check-in:', error);
        res.status(500).json({ success: false, message: 'Failed to update check-in status', error: error.message });
    }
};

// @desc    Get summary ratio of event capacity vs sold tickets
// @route   GET /api/admin/events-summary
// @access  Private/Admin
exports.getEventsSummary = async (req, res) => {
    try {
        const events = await Event.find({}).sort({ date: 1 });
        const bookings = await Booking.find({ paymentStatus: 'Paid' });

        // Map sales count by eventId
        const salesByEvent = {};
        bookings.forEach((b) => {
            const eId = String(b.event);
            salesByEvent[eId] = (salesByEvent[eId] || 0) + (b.quantity || 1);
        });

        const summary = events.map((evt) => {
            let totalCapacity = 0;
            if (evt.ticketTiers && evt.ticketTiers.length > 0) {
                evt.ticketTiers.forEach((tier) => {
                    totalCapacity += (tier.totalSeats || tier.availableSeats || 50);
                });
            } else {
                totalCapacity = 100; // default fallback
            }

            const soldTickets = salesByEvent[String(evt._id)] || 0;
            const remainingSeats = Math.max(0, totalCapacity - soldTickets);
            const occupancyPercentage = totalCapacity > 0 ? Math.min(100, Math.round((soldTickets / totalCapacity) * 100)) : 0;

            let alertLevel = 'Normal';
            if (remainingSeats <= 5) alertLevel = 'Critical';
            else if (occupancyPercentage >= 80) alertLevel = 'High Demand';

            return {
                _id: evt._id,
                customId: evt.customId || `EVT-${String(evt._id).substring(0, 4).toUpperCase()}`,
                title: evt.title,
                date: evt.date,
                venueName: evt.venue?.name || 'Main Hall',
                totalCapacity,
                soldTickets,
                remainingSeats,
                occupancyPercentage,
                alertLevel,
                ratioString: `${soldTickets} / ${totalCapacity} seats booked - ${occupancyPercentage}%`
            };
        });

        res.status(200).json({
            success: true,
            count: summary.length,
            events: summary
        });
    } catch (error) {
        console.error('Error fetching events summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events summary', error: error.message });
    }
};
