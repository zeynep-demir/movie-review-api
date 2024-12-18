const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  review: { type: String, required: true },
  rating: { type: Number, required: true },
});

module.exports = mongoose.model('Review', reviewSchema);
