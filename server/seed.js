const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');

dotenv.config();

const users = [
    { name: 'Admin User', email: 'admin@eventora.com', password: 'password123', role: 'admin' },
    { name: 'Demo User', email: 'user@eventora.com', password: 'password123', role: 'user' },
    { name: 'Alice Smith', email: 'alice@eventora.com', password: 'password123', role: 'user' },
    { name: 'Bob Johnson', email: 'bob@eventora.com', password: 'password123', role: 'user' },
    { name: 'Charlie Dave', email: 'charlie@eventora.com', password: 'password123', role: 'user' },
    { name: 'Diana Prince', email: 'diana@eventora.com', password: 'password123', role: 'user' },
    { name: 'Ethan Hunt', email: 'ethan@eventora.com', password: 'password123', role: 'user' },
    { name: 'Fiona Gallagher', email: 'fiona@eventora.com', password: 'password123', role: 'user' },
    { name: 'George Miller', email: 'george@eventora.com', password: 'password123', role: 'user' },
    { name: 'Hannah Montana', email: 'hannah@eventora.com', password: 'password123', role: 'user' }
];

const events = [
    {
        customId: 'evt-001',
        slug: 'the-midnight-chamber-symphony',
        title: 'The Midnight Chamber Symphony',
        description: 'An intimate evening of candlelight acoustic performances featuring 18th-century chamber concertos alongside modern minimal compositions. Performed in Vienna\'s historic resonant hall with acoustic multi-channel live streaming.',
        date: new Date('2026-10-12T20:30:00'),
        time: '20:30',
        venue: {
            name: 'Wiener Musikverein Hall',
            city: 'Vienna',
            address: 'Musikvereinsplatz 1, 1010 Wien'
        },
        category: 'Classical & Orchestral',
        bannerImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200',
        ticketTiers: [
            { name: 'Balcony Pass', price: 45, totalSeats: 120, availableSeats: 48 },
            { name: 'Orchestra Front', price: 95, totalSeats: 60, availableSeats: 12 }
        ],
        status: 'Published'
    },
    {
        customId: 'evt-002',
        slug: 'neural-canvas-ai-generative-art-triennial',
        title: 'Neural Canvas: AI & Generative Art Triennial',
        description: 'A three-day gathering exploring autonomous creative agents, generative neural shaders, and spatial interactive installations. Featuring keynote dialogues with lead researchers and digital artisans.',
        date: new Date('2026-10-18T10:00:00'),
        time: '10:00',
        venue: {
            name: 'Mori Center for Generative Art',
            city: 'Tokyo',
            address: 'Roppongi Hills Mori Tower 53F, Tokyo'
        },
        category: 'Exhibition & Summit',
        bannerImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200',
        ticketTiers: [
            { name: 'Day Pass', price: 30, totalSeats: 300, availableSeats: 180 },
            { name: 'Keynote + Artist Dinner', price: 140, totalSeats: 40, availableSeats: 6 }
        ],
        status: 'Published'
    },
    {
        customId: 'evt-003',
        slug: 'sunburst-warehouse-deep-techno-all-night',
        title: 'Sunburst Warehouse: Deep Techno All-Night',
        description: 'Raw analog synth textures and hypnotic polyrhythms inside a decommissioned industrial power station. Powered by custom vintage horn speaker arrays.',
        date: new Date('2026-10-24T23:00:00'),
        time: '23:00',
        venue: {
            name: 'Kraftwerk Industrial Complex',
            city: 'Berlin',
            address: 'Köpenicker Str. 70, 10179 Berlin'
        },
        category: 'Underground Club',
        bannerImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200',
        ticketTiers: [
            { name: 'Early Entry (Before Midnight)', price: 20, totalSeats: 200, availableSeats: 95 },
            { name: 'Full Night Pass', price: 35, totalSeats: 500, availableSeats: 210 }
        ],
        status: 'Published'
    },
    {
        customId: 'evt-004',
        slug: 'architectural-ceramics-masterclass-with-studio-ko',
        title: 'Architectural Ceramics Masterclass with Studio Kō',
        description: 'A hands-on masterclass focusing on high-fire reduction glazes, hand-thrown structural vessels, and Japanese wabi-sabi architectural forms.',
        date: new Date('2026-11-02T14:00:00'),
        time: '14:00',
        venue: {
            name: 'Studio Kō Kiln Workshop',
            city: 'Kyoto',
            address: 'Higashiyama Ward, Kyoto'
        },
        category: 'Workshop',
        bannerImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1200',
        ticketTiers: [
            { name: 'Studio Seat & Clay Kit', price: 85, totalSeats: 16, availableSeats: 4 }
        ],
        status: 'Published'
    },
    {
        customId: 'evt-005',
        slug: 'standup-in-the-round-an-evening-of-raw-satire',
        title: 'Standup in the Round: An Evening of Raw Satire',
        description: 'Unfiltered observational standup and topical satire staged inside an amphitheater setting. Intimate seating with zero distance between comic and audience.',
        date: new Date('2026-11-09T19:30:00'),
        time: '19:30',
        venue: {
            name: 'Soho Theatre Arena',
            city: 'London',
            address: '21 Dean St, London W1D 3NE'
        },
        category: 'Comedy',
        bannerImage: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=1200',
        ticketTiers: [
            { name: 'Standard Seat', price: 28, totalSeats: 150, availableSeats: 62 },
            { name: 'Front Row + Drink', price: 50, totalSeats: 30, availableSeats: 8 }
        ],
        status: 'Published'
    },
    {
        customId: 'evt-006',
        slug: 'nordic-roast-slow-brew-invitational',
        title: 'Nordic Roast & Slow Brew Invitational',
        description: 'Featuring 12 independent Scandinavian micro-roasters showcasing single-origin light roasts, precision hand pours, and sensory cupping sessions.',
        date: new Date('2026-11-15T09:00:00'),
        time: '09:00',
        venue: {
            name: 'Kødbyen Market Hall',
            city: 'Copenhagen',
            address: 'Flæsketorvet 1, 1711 København'
        },
        category: 'Gastronomy',
        bannerImage: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1200',
        ticketTiers: [
            { name: 'Tasting Flight Pass', price: 38, totalSeats: 90, availableSeats: 31 }
        ],
        status: 'Published'
    }
];

const seedDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/eventora';
        await mongoose.connect(mongoUri);
        console.log('\n✅ MongoDB connection open for seeding...');

        await User.deleteMany();
        await Event.deleteMany();
        await Booking.deleteMany();
        console.log('🗑️  Cleared existing data.');

        const salt = await bcrypt.genSalt(10);
        const hashedUsers = users.map(u => ({
            ...u,
            password: bcrypt.hashSync(u.password, salt),
            isVerified: true
        }));

        const createdUsers = await User.insertMany(hashedUsers);
        const adminUser = createdUsers.find(u => u.role === 'admin');
        const normalUsers = createdUsers.filter(u => u.role === 'user');
        console.log(`👤 Created ${createdUsers.length} total dummy users.`);

        const eventsWithAdmin = events.map(e => ({
            ...e,
            organizer: adminUser._id
        }));

        const createdEvents = await Event.create(eventsWithAdmin);
        console.log(`🎉 Created ${createdEvents.length} distinct events with customId ('evt-001'..'evt-006') and images.`);

        const bookingsData = [];
        let bookingCounter = 1000;

        for (const event of createdEvents) {
            const randomCount = Math.floor(Math.random() * 4) + 3;
            const shuffledUsers = [...normalUsers].sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, randomCount);

            for (const user of selectedUsers) {
                bookingCounter++;
                const bookingRef = `EVT-2026-${bookingCounter}`;
                const firstTier = (event.ticketTiers && event.ticketTiers[0]) ? event.ticketTiers[0] : null;
                const tierName = firstTier ? firstTier.name : 'Standard Admission';
                const ticketPrice = firstTier ? firstTier.price : (event.ticketPrice || 0);

                const statuses = ['Paid', 'Pending', 'Refunded'];
                const paymentStatus = statuses[Math.floor(Math.random() * statuses.length)];

                const qrCodeData = `https://eventora.org/verify/${bookingRef}`;

                bookingsData.push({
                    bookingRef,
                    event: event._id,
                    user: user._id,
                    tier: tierName,
                    quantity: 1,
                    totalPrice: ticketPrice,
                    qrCodeData,
                    paymentStatus,
                    checkInStatus: false
                });

                if (paymentStatus === 'Paid' && firstTier) {
                    firstTier.availableSeats = Math.max(0, firstTier.availableSeats - 1);
                    await event.save();
                }
            }
        }

        await Booking.insertMany(bookingsData);
        console.log(`🎫 Inserted ${bookingsData.length} randomized dummy bookings.`);
        console.log('\n🚀 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedDatabase();
