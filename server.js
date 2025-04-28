const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

const app = express();

// Load environment variables
dotenv.config();

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Stop server if MongoDB connection fails
  });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve static files

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const documentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  docType: { type: String, required: true },
  filename: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
const Document = mongoose.model('Document', documentSchema);

// Multer file upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Routes

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing username, email, or password' });
  }
  try {
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Fetch all documents
app.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find({});
    res.json(docs);
  } catch (err) {
    console.error('Fetch documents error:', err.message);
    res.status(500).json({ message: 'Fetch failed' });
  }
});

// Upload document
app.post('/upload', upload.single('document'), async (req, res) => {
  const { username, docType } = req.body;
  console.log('📄 Received document upload:', username, docType);

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const newDoc = new Document({
      username,
      docType,
      filename: req.file.filename,
    });
    await newDoc.save();
    res.status(201).json({ message: 'Document uploaded successfully' });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Fetch documents by username
app.get('/documents/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const docs = await Document.find({ username });
    res.json(docs);
  } catch (err) {
    console.error('Fetch documents by username error:', err.message);
    res.status(500).json({ message: 'Fetch failed' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
