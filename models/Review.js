const mongoose = require("mongoose");

const max = [0,5];

const reviewSchema = new mongoose.Schema(
  {
    productUrl: { type: String, required: true},
		name: { type: String, required: true},
		email: { type: String, required: true},
		stars: { type: Number, required: true, min: max[0], max: max[1]},
		title: { type: String, required: true},
		message: { type: String, required: true}
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

exports.Review = Review;
