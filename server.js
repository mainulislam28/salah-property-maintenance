const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

mongoose.set('bufferCommands', false);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB Connection
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing in .env');
} else {
    mongoose.connect(process.env.MONGODB_URI, {
        family: 4,
        serverSelectionTimeoutMS: 15000
    })
        .then(() => console.log('MongoDB connected successfully'))
        .catch(err => {
            console.error('MongoDB connection error:', err.message);
            console.log('Using local JSON storage for contacts and reviews');
        });
}

// Contact Form Schema
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    service: {
        type: String,
        required: true,
        enum: ['painting', 'plumbing', 'tiling', 'carpentry', 'repairs', 'cleaning', 'other']
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Contact = mongoose.model('Contact', contactSchema);

const visitSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    service: {
        type: String,
        required: true,
        enum: ['painting', 'plumbing', 'tiling', 'carpentry', 'repairs', 'cleaning', 'other']
    },
    preferredDate: { type: String, required: true },
    preferredTime: {
        type: String,
        required: true,
        enum: ['morning', 'afternoon', 'evening']
    },
    notes: { type: String, trim: true, default: '' },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    adminNote: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Visit = mongoose.model('Visit', visitSchema);

// Admin Authentication Middleware
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    
    // Simple token validation (in production, use JWT)
    if (token === 'salah-admin-token-2024') {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple authentication (in production, use proper auth)
    if (username === 'salah' && password === 'salah') {
        res.json({
            success: true,
            message: 'Login successful',
            token: 'salah-admin-token-2024'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Review Schema
const reviewSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    service: {
        type: String,
        required: true,
        enum: ['painting', 'plumbing', 'tiling', 'carpentry', 'repairs', 'cleaning', 'other']
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: true,
        trim: true
    },
    photos: {
        type: [String],
        default: []
    },
    approved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.model('Review', reviewSchema);

const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILES = {
    contacts: path.join(DATA_DIR, 'contacts.json'),
    reviews: path.join(DATA_DIR, 'reviews.json'),
    visits: path.join(DATA_DIR, 'visits.json')
};

function ensureStore() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    Object.values(STORE_FILES).forEach((file) => {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, '[]');
        }
    });
}

function dbReady() {
    return mongoose.connection.readyState === 1;
}

function readStore(key) {
    ensureStore();
    try {
        return JSON.parse(fs.readFileSync(STORE_FILES[key], 'utf8'));
    } catch {
        return [];
    }
}

function writeStore(key, items) {
    ensureStore();
    fs.writeFileSync(STORE_FILES[key], JSON.stringify(items, null, 2));
}

function localId() {
    return Date.now().toString(16) + Math.random().toString(16).slice(2, 10);
}

ensureStore();

const REVIEW_UPLOAD_DIR = path.join(__dirname, 'uploads', 'reviews');
if (!fs.existsSync(REVIEW_UPLOAD_DIR)) {
    fs.mkdirSync(REVIEW_UPLOAD_DIR, { recursive: true });
}

const reviewPhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, REVIEW_UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `${Date.now()}-${Math.random().toString(16).slice(2, 10)}${ext}`);
    }
});

const reviewPhotoUpload = multer({
    storage: reviewPhotoStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: 4 },
    fileFilter: (req, file, cb) => {
        if (/^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'));
        }
    }
});

function photoUrlsFromRequest(req) {
    return (req.files || []).map(file => `/uploads/reviews/${file.filename}`);
}

function deletePhotoFiles(photos) {
    (photos || []).forEach((photoPath) => {
        const filename = path.basename(photoPath);
        const fullPath = path.join(REVIEW_UPLOAD_DIR, filename);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    });
}

function handleReviewPhotos(req, res, next) {
    reviewPhotoUpload.array('photos', 4)(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Could not upload photos'
            });
        }
        next();
    });
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes

// Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, phone, email, service, message } = req.body;
        
        // Validate required fields
        if (!name || !phone || !service || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please fill in all required fields' 
            });
        }

        if (!dbReady()) {
            const contacts = readStore('contacts');
            const newContact = {
                _id: localId(),
                name,
                phone,
                email,
                service,
                message,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            contacts.unshift(newContact);
            writeStore('contacts', contacts);
            return res.status(201).json({
                success: true,
                message: 'Contact form submitted successfully',
                data: newContact
            });
        }

        // Create new contact
        const newContact = new Contact({
            name,
            phone,
            email,
            service,
            message
        });

        await newContact.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Contact form submitted successfully',
            data: newContact
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting contact form' 
        });
    }
});

// Get all contacts (for admin)
app.get('/api/contacts', adminAuth, async (req, res) => {
    try {
        if (!dbReady()) {
            return res.status(200).json({
                success: true,
                data: readStore('contacts')
            });
        }
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching contacts' 
        });
    }
});

// Get single contact by ID
app.get('/api/contacts/:id', adminAuth, async (req, res) => {
    try {
        if (!dbReady()) {
            const contact = readStore('contacts').find(c => String(c._id) === req.params.id);
            if (!contact) {
                return res.status(404).json({ success: false, message: 'Contact not found' });
            }
            return res.status(200).json({ success: true, data: contact });
        }
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ 
                success: false, 
                message: 'Contact not found' 
            });
        }
        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching contact' 
        });
    }
});

// Update contact status
app.put('/api/contacts/:id', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!dbReady()) {
            const contacts = readStore('contacts');
            const index = contacts.findIndex(c => String(c._id) === req.params.id);
            if (index === -1) {
                return res.status(404).json({ success: false, message: 'Contact not found' });
            }
            contacts[index].status = status;
            writeStore('contacts', contacts);
            return res.status(200).json({
                success: true,
                message: 'Contact updated successfully',
                data: contacts[index]
            });
        }
        const contact = await Contact.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        
        if (!contact) {
            return res.status(404).json({ 
                success: false, 
                message: 'Contact not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Contact updated successfully',
            data: contact
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating contact' 
        });
    }
});

// Delete contact
app.delete('/api/contacts/:id', adminAuth, async (req, res) => {
    try {
        if (!dbReady()) {
            const contacts = readStore('contacts');
            const next = contacts.filter(c => String(c._id) !== req.params.id);
            if (next.length === contacts.length) {
                return res.status(404).json({ success: false, message: 'Contact not found' });
            }
            writeStore('contacts', next);
            return res.status(200).json({ success: true, message: 'Contact deleted successfully' });
        }
        const contact = await Contact.findByIdAndDelete(req.params.id);
        
        if (!contact) {
            return res.status(404).json({ 
                success: false, 
                message: 'Contact not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting contact' 
        });
    }
});

// ===== VISIT BOOKING API =====

app.post('/api/visits', async (req, res) => {
    try {
        const { name, phone, email, address, service, preferredDate, preferredTime, notes } = req.body;

        if (!name || !phone || !address || !service || !preferredDate || !preferredTime) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        const visitData = {
            name,
            phone,
            email: email || '',
            address,
            service,
            preferredDate,
            preferredTime,
            notes: notes || '',
            status: 'pending',
            adminNote: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!dbReady()) {
            const visits = readStore('visits');
            visitData._id = localId();
            visits.unshift(visitData);
            writeStore('visits', visits);
            return res.status(201).json({
                success: true,
                message: 'Visit request submitted',
                data: visitData
            });
        }

        const newVisit = new Visit(visitData);
        await newVisit.save();
        res.status(201).json({
            success: true,
            message: 'Visit request submitted',
            data: newVisit
        });
    } catch (error) {
        console.error('Error submitting visit:', error);
        res.status(500).json({ success: false, message: 'Error submitting visit request' });
    }
});

function visitPhoneKey(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('44') && digits.length >= 11) {
        return digits.slice(-10);
    }
    if (digits.length >= 10) return digits.slice(-10);
    return digits;
}

function publicVisit(visit) {
    return {
        name: visit.name,
        service: visit.service,
        preferredDate: visit.preferredDate,
        preferredTime: visit.preferredTime,
        address: visit.address,
        status: visit.status,
        adminNote: visit.adminNote || '',
        updatedAt: visit.updatedAt
    };
}

app.get('/api/visits/track', async (req, res) => {
    try {
        const phone = String(req.query.phone || '').trim();
        const key = visitPhoneKey(phone);
        if (key.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Enter the phone number you used when booking'
            });
        }

        const all = dbReady() ? await Visit.find().sort({ createdAt: -1 }) : readStore('visits');
        const matches = all
            .filter(v => visitPhoneKey(v.phone) === key)
            .map(publicVisit);

        res.status(200).json({
            success: true,
            data: matches,
            message: matches.length ? 'Visit requests found' : 'No visit request found for this number'
        });
    } catch (error) {
        console.error('Error tracking visit:', error);
        res.status(500).json({ success: false, message: 'Could not track visit' });
    }
});

app.get('/api/visits', adminAuth, async (req, res) => {
    try {
        if (!dbReady()) {
            return res.status(200).json({ success: true, data: readStore('visits') });
        }
        const visits = await Visit.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: visits });
    } catch (error) {
        console.error('Error fetching visits:', error);
        res.status(500).json({ success: false, message: 'Error fetching visits' });
    }
});

app.put('/api/visits/:id', adminAuth, async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (status && !allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        if (!dbReady()) {
            const visits = readStore('visits');
            const index = visits.findIndex(v => String(v._id) === req.params.id);
            if (index === -1) {
                return res.status(404).json({ success: false, message: 'Visit not found' });
            }
            if (status) visits[index].status = status;
            if (adminNote !== undefined) visits[index].adminNote = adminNote;
            visits[index].updatedAt = new Date().toISOString();
            writeStore('visits', visits);
            return res.status(200).json({
                success: true,
                message: 'Visit updated',
                data: visits[index]
            });
        }

        const visit = await Visit.findByIdAndUpdate(
            req.params.id,
            {
                ...(status ? { status } : {}),
                ...(adminNote !== undefined ? { adminNote } : {}),
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({ success: false, message: 'Visit not found' });
        }

        res.status(200).json({ success: true, message: 'Visit updated', data: visit });
    } catch (error) {
        console.error('Error updating visit:', error);
        res.status(500).json({ success: false, message: 'Error updating visit' });
    }
});

app.delete('/api/visits/:id', adminAuth, async (req, res) => {
    try {
        if (!dbReady()) {
            const visits = readStore('visits');
            const next = visits.filter(v => String(v._id) !== req.params.id);
            if (next.length === visits.length) {
                return res.status(404).json({ success: false, message: 'Visit not found' });
            }
            writeStore('visits', next);
            return res.status(200).json({ success: true, message: 'Visit deleted' });
        }

        const visit = await Visit.findByIdAndDelete(req.params.id);
        if (!visit) {
            return res.status(404).json({ success: false, message: 'Visit not found' });
        }
        res.status(200).json({ success: true, message: 'Visit deleted' });
    } catch (error) {
        console.error('Error deleting visit:', error);
        res.status(500).json({ success: false, message: 'Error deleting visit' });
    }
});

// ===== REVIEW API ENDPOINTS =====

// Submit a review
app.post('/api/reviews', handleReviewPhotos, async (req, res) => {
    try {
        const { name, email, service, rating, review } = req.body;
        const photos = photoUrlsFromRequest(req);
        
        // Validate required fields
        if (!name || !email || !service || !rating || !review) {
            deletePhotoFiles(photos);
            return res.status(400).json({ 
                success: false, 
                message: 'Please fill in all required fields' 
            });
        }
        
        // Validate rating
        if (rating < 1 || rating > 5) {
            deletePhotoFiles(photos);
            return res.status(400).json({ 
                success: false, 
                message: 'Rating must be between 1 and 5' 
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            deletePhotoFiles(photos);
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email address' 
            });
        }
        
        if (!dbReady()) {
            const reviews = readStore('reviews');
            const newReview = {
                _id: localId(),
                name,
                email,
                service,
                rating: Number(rating),
                review,
                photos,
                approved: true,
                createdAt: new Date().toISOString()
            };
            reviews.unshift(newReview);
            writeStore('reviews', reviews);
            return res.status(201).json({
                success: true,
                message: 'Review submitted successfully.',
                data: newReview
            });
        }

        // Create new review
        const newReview = new Review({
            name,
            email,
            service,
            rating,
            review,
            photos
        });
        
        await newReview.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Review submitted successfully. It will be visible after approval.',
            data: newReview
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        deletePhotoFiles(photoUrlsFromRequest(req));
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting review' 
        });
    }
});

// Get all approved reviews (public)
app.get('/api/reviews', async (req, res) => {
    try {
        if (!dbReady()) {
            const reviews = readStore('reviews')
                .filter(r => r.approved)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 50);
            return res.status(200).json({ success: true, data: reviews });
        }
        const reviews = await Review.find({ approved: true })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching reviews' 
        });
    }
});

// Get all reviews (including unapproved - for admin)
app.get('/api/reviews/all', adminAuth, async (req, res) => {
    try {
        if (!dbReady()) {
            const reviews = readStore('reviews')
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return res.status(200).json({ success: true, data: reviews });
        }
        const reviews = await Review.find()
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching reviews' 
        });
    }
});

// Approve a review
app.put('/api/reviews/:id/approve', adminAuth, async (req, res) => {
    try {
        if (!dbReady()) {
            const reviews = readStore('reviews');
            const index = reviews.findIndex(r => String(r._id) === req.params.id);
            if (index === -1) {
                return res.status(404).json({ success: false, message: 'Review not found' });
            }
            reviews[index].approved = true;
            writeStore('reviews', reviews);
            return res.status(200).json({
                success: true,
                message: 'Review approved successfully',
                data: reviews[index]
            });
        }
        const review = await Review.findByIdAndUpdate(
            req.params.id, 
            { approved: true }, 
            { new: true }
        );
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Review approved successfully',
            data: review
        });
    } catch (error) {
        console.error('Error approving review:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error approving review' 
        });
    }
});

// Delete a review
app.delete('/api/reviews/:id', adminAuth, async (req, res) => {
    try {
        if (!dbReady()) {
            const reviews = readStore('reviews');
            const existing = reviews.find(r => String(r._id) === req.params.id);
            const next = reviews.filter(r => String(r._id) !== req.params.id);
            if (next.length === reviews.length) {
                return res.status(404).json({ success: false, message: 'Review not found' });
            }
            deletePhotoFiles(existing && existing.photos);
            writeStore('reviews', next);
            return res.status(200).json({ success: true, message: 'Review deleted successfully' });
        }
        const review = await Review.findByIdAndDelete(req.params.id);
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }

        deletePhotoFiles(review.photos);
        
        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting review' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'Server is running',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve individual pages
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/index.html', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/about.html', (req, res) => {
    res.sendFile(__dirname + '/about.html');
});

app.get('/services.html', (req, res) => {
    res.sendFile(__dirname + '/services.html');
});

app.get('/reviews.html', (req, res) => {
    res.sendFile(__dirname + '/reviews.html');
});

app.get('/contact.html', (req, res) => {
    res.sendFile(__dirname + '/contact.html');
});

// Admin pages
app.get('/admin-login.html', (req, res) => {
    res.sendFile(__dirname + '/admin-login.html');
});

app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(__dirname + '/admin-dashboard.html');
});

app.get('/admin-contacts.html', (req, res) => {
    res.sendFile(__dirname + '/admin-contacts.html');
});

app.get('/admin-reviews.html', (req, res) => {
    res.sendFile(__dirname + '/admin-reviews.html');
});

app.get('/admin-visits.html', (req, res) => {
    res.sendFile(__dirname + '/admin-visits.html');
});

// Handle 404 for unknown routes
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Website: http://localhost:${PORT}/`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in .env`);
        process.exit(1);
    }
    throw err;
});