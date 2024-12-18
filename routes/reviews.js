const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const authMiddleware = require('../middlewares/auth');




// ================== Fetch Reviews for Logged-in User ==================
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch reviews and populate movieId
    const reviews = await Review.find({ userId }).populate({
      path: 'movieId',
      select: 'title poster',
      strictPopulate: false, // Allow null movieId references
    });

    // Format response to handle missing movieId gracefully
    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      movieTitle: review.movieId?.title || 'Unknown Movie',
      poster: review.movieId?.poster || null,
      review: review.review,
      rating: review.rating,
    }));

    res.status(200).json(formattedReviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error.message);
    res.status(500).json({ message: 'Failed to fetch user reviews', error: error.message });
  }
});


// ================== Fetch Reviews for a Specific Movie ==================
router.get('/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: 'Invalid movie ID.' });
    }

    const reviews = await Review.find({ movieId }).populate('userId', 'username');
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching movie reviews:', error.message);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});




// ================== Add a Review and Update Average Rating ==================
router.post('/', authMiddleware, async (req, res) => {
  const { movieId, review, rating } = req.body;

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: 'Invalid movie ID.' });
  }

  if (!movieId || !review || !rating || typeof rating !== 'number') {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Validate the movie ID
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found.' });
    }

    // Save the new review
    const newReview = new Review({
      movieId,
      review,
      rating,
      userId: req.user.id,
    });
    await newReview.save();

    // Update the movie's ratings array and averageRating
    movie.ratings = movie.ratings || []; // Initialize if null
    movie.ratings.push(rating); // Add new rating to ratings array
    const totalRating = movie.ratings.reduce((sum, r) => sum + r, 0);
    movie.averageRating = (totalRating / movie.ratings.length).toFixed(1);
    await movie.save();

    res.status(201).json({ message: 'Review added successfully.', movie });
  } catch (error) {
    console.error('Error adding review:', error.message);
    res.status(500).json({ message: 'Failed to add review.', error: error.message });
  }
});


module.exports = router;
