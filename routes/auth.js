const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Ensure bcrypt is used correctly
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth');

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// -------------------- GET User Profile --------------------
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('watchlist'); // Populate user's watchlist
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      username: user.username,
      watchlist: user.watchlist,
    });
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).json({ message: 'Failed to fetch profile.', error: error.message });
  }
});

// -------------------- REGISTER --------------------
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  try {
    console.log('Register Request Received:', { email, username, password });

    // Validate inputs
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Plain Password:', password);
    console.log('Hashed Password:', hashedPassword);

    // Save the user
    const user = new User({
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: hashedPassword,
    });

    await user.save();
    console.log('User Saved Successfully:', user);

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});



// -------------------- LOGIN --------------------

router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    console.log('Login Request Received:', { emailOrUsername, password });

    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Find user case-insensitively
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.trim().toLowerCase() },
        { username: emailOrUsername.trim().toLowerCase() },
      ],
    });

    console.log('User Found:', user);

    if (!user) {
      console.log('User not found with:', emailOrUsername);
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password Provided by User:', password);
    console.log('Stored Hashed Password:', user.password);
    console.log('Password Match Result:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, {
      expiresIn: '1h',
    });

    console.log('Generated Token:', token);

    res.status(200).json({ token, message: 'Login successful.' });
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});


// -------------------- EXPORT ROUTER --------------------
module.exports = router;

