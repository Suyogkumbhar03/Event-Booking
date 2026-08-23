const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 0 },
    availableSeats: { type: Number, required: true, min: 0 }
}, { _id: true });

const eventSchema = new mongoose.Schema({
    customId: { type: String, unique: true, sparse: true, trim: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true,
        trim: true
    },
    bannerImage: { type: String, default: '' },
    date: { type: Date, required: true },
    time: { type: String, default: '18:00' },
    venue: {
        name: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        address: { type: String, default: '', trim: true }
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketTiers: {
        type: [ticketTierSchema],
        default: []
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'SoldOut', 'Completed', 'Cancelled'],
        default: 'Published'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Backward compatibility virtual for createdBy -> organizer
eventSchema.virtual('createdBy').get(function () {
    return this.organizer;
}).set(function (v) {
    this.organizer = v;
});

// Backward compatibility virtual for image -> bannerImage
eventSchema.virtual('image').get(function () {
    return this.bannerImage;
}).set(function (v) {
    this.bannerImage = v;
});

// Backward compatibility virtual for location -> venue text
eventSchema.virtual('location').get(function () {
    if (!this.venue) return '';
    return `${this.venue.name}, ${this.venue.city}`;
});

// Auto-generate slug from title before validation if not present
eventSchema.pre('validate', function (next) {
    if (this.title && (!this.slug || this.isModified('title'))) {
        const baseSlug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        this.slug = `${baseSlug}-${randomSuffix}`;
    }
    next();
});

module.exports = mongoose.model('Event', eventSchema);
