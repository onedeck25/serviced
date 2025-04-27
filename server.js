const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();

// Load environment variables
require('dotenv').config(); // Not mandatory on Render but useful locally

// MongoDB Atlas connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mongoose User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
});

const documentSchema = new mongoose.Schema({
  username: String,
  docType: String,
  filename: String,
});

const User = mongoose.model('User', userSchema);
const Document = mongoose.model('Document', documentSchema);

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// Routes

// Signup Route
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all documents
app.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find({});
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch failed' });
  }
});

// Upload document
app.post('/upload', upload.single('document'), async (req, res) => {
  const { username, docType } = req.body;
  console.log('Received document upload:', username, docType);

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
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get documents for a specific user
app.get('/documents/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const docs = await Document.find({ username });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch failed' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
