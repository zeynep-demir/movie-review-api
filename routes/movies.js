const express = require('express');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const authMiddleware = require('../middlewares/auth');
const User = require('../models/User');

const router = express.Router();

// Fetch All Movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error.message);
    res.status(500).json({ message: 'Failed to fetch movies.' });
  }
});

// Fetch Movies by Genre
router.get('/genres', async (req, res) => {
  try {
    const moviesByGenre = await Movie.aggregate([
      { $group: { _id: "$genre", movies: { $push: "$$ROOT" } } }
    ]);
    res.status(200).json(moviesByGenre);
  } catch (error) {
    console.error('Error fetching movies by genre:', error.message);
    res.status(500).json({ message: 'Failed to fetch genres.' });
  }
});

// Fetch Single Movie by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Movie ID format.' });
    }

    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ message: 'Movie not found.' });

    res.status(200).json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error.message);
    res.status(500).json({ message: 'Failed to fetch movie details.' });
  }
});

// Add Movie to Watchlist
router.post('/:movieId/add-to-watchlist', authMiddleware, async (req, res) => {
  const { movieId } = req.params;

  try {
    // Validate the movie ID
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: 'Invalid movie ID format.' });
    }

    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the movie already exists in the user's watchlist
    if (user.watchlist.includes(movieId)) {
      return res.status(400).json({ message: 'Movie already in your watchlist.' });
    }

    // Push the movie ID to the watchlist
    user.watchlist.push(new mongoose.Types.ObjectId(movieId));
    await user.save();

    return res.status(200).json({
      message: 'Movie added to watchlist successfully.',
      watchlist: user.watchlist,
    });
  } catch (error) {
    console.error('Error adding movie to watchlist:', error.message);
    return res.status(500).json({ message: 'Failed to add movie to watchlist.', error: error.message });
  }
});

// POST route to add a new movie
router.post("/", async (req, res) => {
  try {
    const { title, poster, description, releaseDate, genre, ratings, averageRating } = req.body;

    // Validate required fields
    if (!title || !poster || !description || !releaseDate || !genre) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create new movie
    const newMovie = new Movie({
      title,
      poster,
      description,
      releaseDate,
      genre,
      ratings: ratings || [],
      averageRating: averageRating || 0,
    });

    // Save movie to database
    await newMovie.save();
    res.status(201).json({ message: "Movie added successfully", movie: newMovie });
  } catch (error) {
    console.error("Error adding movie:", error.message);
    res.status(500).json({ message: "Failed to add movie." });
  }
});

router.delete('/', async (req, res) => {
  try {
    await Movie.deleteMany({}); // Tüm filmleri sil
    res.status(200).json({ message: 'All movies deleted successfully.' });
  } catch (error) {
    console.error('Error deleting all movies:', error.message);
    res.status(500).json({ message: 'Failed to delete all movies.' });
  }
});


module.exports = router;
