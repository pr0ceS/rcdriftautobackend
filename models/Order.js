const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String },
    products: [],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    shipping: { type: Object, required: true },
    delivery_status: { type: String, default: "pending" },
    payment_method: { type: String },
    payment_status: { type: String },
		paymentIntentId: { type: String },
		customerId: { type: String },
		reference: { type: String },
		paypal_id: {type: String},
		paypal_payer_id: {type: String}
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

exports.Order = Order;
