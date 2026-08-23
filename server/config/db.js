const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb+srv://suyogkumbhar087_db_user:root@cluster0.7etpksh.mongodb.net/eventora_db?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_URI;

    mongoose.connection.on('connected', () => {
        console.log('[MongoDB Event] Connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
        console.error('[MongoDB Event] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB Event] Connection disconnected.');
    });

    try {
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`[MongoDB] Connected to host: ${conn.connection.host}`);
        console.log(`[MongoDB] Database name: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error(`[MongoDB] Initial connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
