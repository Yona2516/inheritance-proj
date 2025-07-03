const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const dotenv = require('dotenv');
// const Beem = require('beem'); // Uncomment if using Beem SMS SDK

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (_, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// ============ ROUTES ============ //

// ✅ Get all beneficiaries
app.get(':3000/api/beneficiaries', (req, res) => {
  const sql = 'SELECT * FROM beneficiaries ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ NEW: Return only username, phone, and password
app.get('/api/beneficiaries/simple', (req, res) => {
  const sql = 'SELECT username, phone, password FROM beneficiaries ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ Register new beneficiary with PDF upload
app.post('/api/register', upload.single('will'), (req, res) => {
  const { name, age, phone, relation, address, username, password } = req.body;
  const pdfPath = req.file?.filename || '';

  const sql = `
    INSERT INTO beneficiaries (name, age, phone, relation, address, will_pdf, username, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [name, age, phone, relation, address, pdfPath, username, password];

  db.query(sql, values, (err) => {
    if (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Beneficiary registered successfully' });
  });
});

// ✅ Update beneficiary
app.post('/api/update-beneficiary', (req, res) => {
  const { id, name, age, phone, relation, address, username, password } = req.body;

  const sql = `
    UPDATE beneficiaries
    SET name = ?, age = ?, phone = ?, relation = ?, address = ?, username = ?, password = ?
    WHERE id = ?
  `;
  const values = [name, age, phone, relation, address, username, password, id];

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Beneficiary updated successfully' });
  });
});

// ✅ Delete beneficiary
app.delete('/api/delete-beneficiary/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM beneficiaries WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Beneficiary deleted successfully' });
  });
});

// ✅ Beneficiary login
app.post('/api/beneficiary-login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM beneficiaries WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      const user = results[0];
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// ✅ Notify via SMS (mock or real Beem API)
app.post('/api/notify', (req, res) => {
  const { phone, message } = req.body;

  // Uncomment and configure if using Beem SDK
  /*
  beem.sendSMS({
    to: phone,
    message,
    from: "INHERITANCE"
  }).then(response => {
    res.json({ success: true, response });
  }).catch(error => {
    console.error("SMS Error:", error);
    res.status(500).json({ error });
  });
  */

  // Mock implementation
  console.log(`📨 Sending SMS to ${phone}: "${message}"`);
  res.json({ success: true, message: 'Mock SMS sent (no real API call).' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://145.223.98.156:${PORT}`);
});
