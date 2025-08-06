const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use env in production

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
// 🔴 COMMENT or REMOVE unused imports/routes below until you create these files
// const dashboardRoutes = require('./routes/dashboard');
// const notificationRoutes = require('./routes/notifications');
// const applicantsRoutes = require('./routes/applicants');
// const scheduleRoutes = require('./routes/schedule');

// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/applicants', applicantsRoutes);
// app.use('/api/schedule', scheduleRoutes);

// Register route
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    await User.create({ email, password, username });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isValid = await User.verifyPassword(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await User.createSession(user.id, token, expiresAt);

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// SMTP Setup (Gmail App Password recommended)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'sandeep.yadav@darteweb.in',
    pass: process.env.SMTP_PASS || 'qsge plqt hkzx jzap',
  },
  tls: { rejectUnauthorized: false }
});

transporter.verify((error, success) => {
  if (error) console.error('SMTP Error:', error);
  else console.log('✅ SMTP is ready');
});

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await User.createPasswordReset(user.id, otp, expiresAt);

    const mailOptions = {
      from: process.env.SMTP_USER || 'sandeep.yadav@darteweb.in',
      to: email,
      subject: 'Password Reset OTP',
      html: `<h2>Your OTP: ${otp}</h2><p>This OTP will expire in 10 minutes.</p>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetRequest = await User.findPasswordReset(otp);
    if (!resetRequest) return res.status(400).json({ message: 'Invalid or expired OTP' });

    await User.updatePassword(user.id, newPassword);
    await User.deletePasswordReset(otp);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
