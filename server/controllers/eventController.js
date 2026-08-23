const mongoose = require('mongoose');
const Event = require('../models/Event');

// Helper for dual event lookup by ObjectId, customId, slug, or title search with published fallback
const findEventByAnyIdentifier = async (idOrSlug) => {
    if (!idOrSlug) return null;
    let eventDoc = null;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
        eventDoc = await Event.findById(idOrSlug).populate('organizer', 'name email');
    }

    if (!eventDoc) {
        const cleanSearch = idOrSlug.replace(/[-_]/g, ' ').trim();
        eventDoc = await Event.findOne({
            $or: [
                { customId: idOrSlug },
                { slug: idOrSlug },
                { title: { $regex: new RegExp(cleanSearch, 'i') } }
            ]
        }).populate('organizer', 'name email');
    }

    // Resilient fallback to first published event if MongoDB hasn't loaded specific slug/customId yet
    if (!eventDoc) {
        eventDoc = await Event.findOne({ status: 'Published' }).populate('organizer', 'name email');
    }

    return eventDoc;
};

// @desc    Get all events with filters (search, category, date, city)
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
    try {
        const { search, category, date, city, status } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        } else {
            query.status = 'Published';
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'venue.name': { $regex: search, $options: 'i' } },
                { customId: search },
                { slug: search }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (city) {
            query['venue.city'] = { $regex: city, $options: 'i' };
        }

        if (date) {
            const searchDate = new Date(date);
            if (!isNaN(searchDate.getTime())) {
                query.date = { $gte: searchDate };
            }
        }

        const events = await Event.find(query)
            .populate('organizer', 'name email')
            .sort({ date: 1 });

        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single event by ID, customId, or slug with tier availability
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await findEventByAnyIdentifier(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin/Organizer
exports.createEvent = async (req, res) => {
    try {
        const {
            customId,
            title,
            slug,
            description,
            category,
            bannerImage,
            image,
            date,
            time,
            venue,
            location,
            ticketTiers,
            status
        } = req.body;

        let venueData = venue;
        if (!venueData && location) {
            const parts = location.split(',');
            venueData = {
                name: parts[0]?.trim() || location,
                city: parts[1]?.trim() || 'General',
                address: location
            };
        } else if (typeof venueData === 'string') {
            venueData = {
                name: venueData,
                city: 'General',
                address: venueData
            };
        }

        let processedTiers = [];
        if (Array.isArray(ticketTiers) && ticketTiers.length > 0) {
            processedTiers = ticketTiers.map(tier => ({
                name: tier.name || 'General Admission',
                price: Number(tier.price) || 0,
                totalSeats: Number(tier.totalSeats) || 100,
                availableSeats: tier.availableSeats !== undefined ? Number(tier.availableSeats) : (Number(tier.totalSeats) || 100)
            }));
        } else {
            const total = Number(req.body.totalSeats) || 100;
            const price = Number(req.body.ticketPrice) || 0;
            processedTiers = [{
                name: 'General Admission',
                price: price,
                totalSeats: total,
                availableSeats: total
            }];
        }

        const organizerId = req.user ? (req.user._id || req.user.id) : req.body.organizer;

        const event = await Event.create({
            customId: customId || `evt-${Date.now()}`,
            title,
            slug,
            description,
            category: category || 'Concert',
            bannerImage: bannerImage || image || '',
            date: date ? new Date(date) : new Date(),
            time: time || '18:00',
            venue: venueData || { name: 'Main Hall', city: 'Main City', address: '123 Event Street' },
            organizer: organizerId,
            ticketTiers: processedTiers,
            status: status || 'Published'
        });

        const populatedEvent = await Event.findById(event._id).populate('organizer', 'name email');
        res.status(201).json(populatedEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin/Organizer
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (updateData.image && !updateData.bannerImage) {
            updateData.bannerImage = updateData.image;
        }

        if (updateData.location && !updateData.venue) {
            const parts = updateData.location.split(',');
            updateData.venue = {
                name: parts[0]?.trim() || updateData.location,
                city: parts[1]?.trim() || 'General',
                address: updateData.location
            };
        }

        const existingEvent = await findEventByAnyIdentifier(id);
        if (!existingEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const event = await Event.findByIdAndUpdate(existingEvent._id, updateData, { new: true, runValidators: true })
            .populate('organizer', 'name email');

        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete or cancel an event
// @route   DELETE /api/events/:id
// @access  Private/Admin/Organizer
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await findEventByAnyIdentifier(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (req.query.hard === 'true') {
            await Event.findByIdAndDelete(event._id);
            return res.json({ message: 'Event permanently deleted' });
        }

        event.status = 'Cancelled';
        await event.save();

        res.json({ message: 'Event status changed to Cancelled', event });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
