const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Universal CORS configuration for all routes
const allowedOrigins = [
  'http://145.223.98.156:3000', // Your frontend
  'http://localhost:3000'       // Local development
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests for all routes
app.options('*', cors());

// Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (_, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// ============ ROUTES ============ //

// Get all beneficiaries
app.get('/api/beneficiaries', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM beneficiaries ORDER BY id DESC');
    res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch beneficiaries' });
  }
});

// Return only username, phone, and password
app.get('/api/beneficiaries/simple', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT username, phone, password FROM beneficiaries ORDER BY id DESC'
    );
    res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch simplified beneficiary data' });
  }
});

// Register new beneficiary with PDF upload
app.post('/api/register', upload.single('will'), async (req, res) => {
  try {
    const { name, age, phone, relation, address, username, password } = req.body;
    const pdfPath = req.file?.filename || '';

    const [result] = await db.query(
      `INSERT INTO beneficiaries 
       (name, age, phone, relation, address, will_pdf, username, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, age, phone, relation, address, pdfPath, username, password]
    );

    res.json({ 
      success: true, 
      message: 'Beneficiary registered successfully',
      id: result.insertId 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed',
      details: err.message 
    });
  }
});

// Update beneficiary
app.put('/api/update-beneficiary/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, phone, relation, address, username, password } = req.body;

    const [result] = await db.query(
      `UPDATE beneficiaries
       SET name = ?, age = ?, phone = ?, relation = ?, address = ?, username = ?, password = ?
       WHERE id = ?`,
      [name, age, phone, relation, address, username, password, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    res.json({ success: true, message: 'Beneficiary updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Update failed',
      details: err.message 
    });
  }
});

// Delete beneficiary
app.delete('/api/delete-beneficiary/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM beneficiaries WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    res.json({ success: true, message: 'Beneficiary deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Deletion failed',
      details: err.message 
    });
  }
});

// Beneficiary login
app.post('/api/beneficiary-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [results] = await db.query(
      'SELECT * FROM beneficiaries WHERE username = ? AND password = ?',
      [username, password]
    );

    if (results.length > 0) {
      const user = results[0];
      const { password: _, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Login failed',
      details: err.message 
    });
  }
});

// Notify via SMS
app.post('/api/notify', async (req, res) => {
  try {
    const { phone, message } = req.body;
    console.log(`📨 Sending SMS to ${phone}: "${message}"`);
    res.json({ success: true, message: 'Mock SMS sent (no real API call).' });
  } catch (err) {
    console.error("SMS Error:", err);
    res.status(500).json({ 
      success: false,
      error: 'Notification failed',
      details: err.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://145.223.98.156:${PORT}`);
  console.log(`🔗 Local access: http://localhost:${PORT}`);
});