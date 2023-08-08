const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
		// desc: {"details": "20cm long", "suited-for": "Workspace-Office"}
    desc: { type: String },
    price: { type: Number, required: true },
    image: { type: Array, required: true },
		url: {type: String, required: true, unique: true },
		tax: {type: Number},
    sale: { type: Number },
		// Amount in stock
		stock: {type: Number},
		deliveryTime: {type: Number},
		// Color of the product
		color: {type: String},
		// Ranglijst verkoop: Bestseller, Neue, Populaire
		ranking: {type: String},
		// If the product is sold out
		soldOut: {type: Boolean, default: false},
		// Average Rating
		averageRating: {type: Number, default: 0},
		// Rating Count
		ratingCount: {type: Number, default: 0}
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

exports.Product = Product;
