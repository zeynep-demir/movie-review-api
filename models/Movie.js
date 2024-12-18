const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  poster: { type: String, required: true },
  description: { type: String, required: true },
  releaseDate: { type: String, required: true },
  ratings: { type: [Number], default: [] }, // Array of individual ratings
  averageRating: { type: Number, default: 0 }, // Average rating
  genre: { type: String, required: true },
});

module.exports = mongoose.model('Movie', movieSchema);
