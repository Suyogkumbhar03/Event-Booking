const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingRef: {
        type: String,
        required: true,
        unique: true,
        index: true,
        uppercase: true,
        trim: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    guestInfo: {
        name: { type: String, trim: true },
        email: { type: String, trim: true }
    },
    tier: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    qrCodeData: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Refunded'],
        default: 'Paid'
    },
    checkInStatus: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Backward compatibility virtual for eventId -> event
bookingSchema.virtual('eventId').get(function () {
    return this.event;
}).set(function (v) {
    this.event = v;
});

// Backward compatibility virtual for userId -> user
bookingSchema.virtual('userId').get(function () {
    return this.user;
}).set(function (v) {
    this.user = v;
});

// Backward compatibility virtual for amount -> totalPrice
bookingSchema.virtual('amount').get(function () {
    return this.totalPrice;
}).set(function (v) {
    this.totalPrice = v;
});

// Backward compatibility virtual for status
bookingSchema.virtual('status').get(function () {
    if (this.paymentStatus === 'Paid') return 'confirmed';
    if (this.paymentStatus === 'Refunded') return 'cancelled';
    return 'pending';
});

module.exports = mongoose.model('Booking', bookingSchema);
