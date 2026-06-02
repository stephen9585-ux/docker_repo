const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// --- CONFIGURATION (from environment variables) ---
const PORT     = process.env.PORT     || 5000;
const DB_HOST  = process.env.DB_HOST  || 'mongo';       // Docker service name
const DB_PORT  = process.env.DB_PORT  || 27017;
const DB_NAME  = process.env.DB_NAME  || 'level1_db';
const DB_USER  = process.env.DB_USER  || 'appServer';
const DB_PASS  = process.env.DB_PASS  || 'password123';

const MONGO_URI = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=${DB_NAME}`;

// --- DATABASE CONNECTION (with retry) ---
const connectWithRetry = () => {
    console.log(`⏳ Connecting to MongoDB at ${DB_HOST}:${DB_PORT}...`);
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ Successfully connected to MongoDB'))
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
            console.log('🔄 Retrying in 5 seconds...');
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();

// --- SCHEMA & MODEL ---
const UserSchema = new mongoose.Schema({
    username:  { type: String, required: true },
    password:  { type: String, required: true },  // Plain text (demo only — use bcrypt in prod)
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// --- ROUTES ---

// POST /api/login — Save a user record
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ status: 'Error', message: 'Username and password required.' });
        }
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ status: 'Success', message: `User "${username}" saved to MongoDB!` });
    } catch (err) {
        res.status(500).json({ status: 'Error', message: err.message });
    }
});

// GET /api/status — Health check
app.get('/api/status', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states  = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    res.json({
        service:  'Backend Online',
        database: states[dbState] || 'Unknown',
        uptime:   `${Math.floor(process.uptime())}s`
    });
});

// GET /api/users — List all saved users (dev/debug use)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude passwords
        res.json({ count: users.length, users });
    } catch (err) {
        res.status(500).json({ status: 'Error', message: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
});
