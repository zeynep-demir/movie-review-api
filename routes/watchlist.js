const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const User = require('../models/User');

// Fetch User's Watchlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'watchlist',
      select: 'title poster description releaseDate rating',
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ watchlist: user.watchlist });
  } catch (error) {
    console.error('Error fetching watchlist:', error.message);
    res.status(500).json({
      message: 'Failed to fetch watchlist.',
      error: error.message,
    });
  }
});

// Remove a Movie from Watchlist
router.delete('/:movieId', authMiddleware, async (req, res) => {
  const { movieId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: 'Invalid movie ID format.' });
    }

    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { watchlist: new mongoose.Types.ObjectId(movieId) } },
      { new: true }
    ).populate('watchlist');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'Movie removed from watchlist successfully.',
      watchlist: user.watchlist,
    });
  } catch (error) {
    console.error('Error removing movie from watchlist:', error.message);
    res.status(500).json({ message: 'Failed to remove movie from watchlist.' });
  }
});


module.exports = router;
