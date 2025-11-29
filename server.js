// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer'); // optional email notifications

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ------------- sqlite setup -------------
const DB_PATH = path.join(__dirname, 'bookings.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error('DB open error', err);
  console.log('Connected to SQLite DB.');
});

// create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location TEXT,
  date TEXT,
  time TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
)`);

// ------------- nodemailer (optional) -------------
// Configure SMTP to get email notification on new bookings.
// Replace with your SMTP provider and credentials.
const EMAIL_ENABLED = false; // set true if you configure below
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com', // e.g. smtp.gmail.com
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com',
    pass: 'your-email-password'
  }
});

// ------------- helper to create whatsapp url -------------
function buildWhatsAppUrl(phoneNumberWithCountry, booking) {
  // phoneNumberWithCountry must be digits only with country code e.g. 919876543210
  const msg =
    `🚗 *New Car Wash Booking*%0A%0A` +
    `📍 *Location:* ${encodeURIComponent(booking.location)}%0A` +
    `📅 *Date:* ${encodeURIComponent(booking.date)}%0A` +
    `⏰ *Time:* ${encodeURIComponent(booking.time)}%0A%0A` +
    `Please confirm availability.`;
  return `https://wa.me/${phoneNumberWithCountry}?text=${msg}`;
}

// ------------- POST /api/book -------------
app.post('/api/book', (req, res) => {
  const { location, date, time } = req.body;
  if (!location || !date || !time) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  // insert into DB
  const stmt = db.prepare('INSERT INTO bookings (location, date, time) VALUES (?,?,?)');
  stmt.run(location, date, time, function(err) {
    if (err) {
      console.error('DB insert error', err);
      return res.status(500).json({ success: false, error: 'DB error' });
    }

    const bookingId = this.lastID;
    console.log('New booking saved, id:', bookingId);

    // optional: send email notification
    if (EMAIL_ENABLED) {
      const mailOptions = {
        from: '"Doorstep CarWash" <no-reply@example.com>',
        to: 'owner@example.com', // change to your email
        subject: `New booking #${bookingId}`,
        text: `New booking:\nLocation: ${location}\nDate: ${date}\nTime: ${time}`
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Mail error', err);
        else console.log('Notification email sent', info.response);
      });
    }

    // prepare whatsapp url (replace with your number, digits only)
    const yourPhone = '91XXXXXXXXXX'; // <-- REPLACE with your WhatsApp phone (country code + number, no + or 00)
    const whatsapp_url = buildWhatsAppUrl(yourPhone, { location, date, time });

    res.json({ success: true, bookingId, whatsapp_url });
  });
});

// ------------- simple admin endpoint to list bookings -------------
app.get('/api/bookings', (req, res) => {
  db.all('SELECT * FROM bookings ORDER BY id DESC LIMIT 200', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'DB read error' });
    res.json({ success: true, bookings: rows });
  });
});

// ------------- start server -------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
