const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
		userId: { type: String },
		addressB: { type: Object },
		addressS: { type: Object },
		UST: { type: String },
		KVK: { type: String },
		BTW: { type: String },
		IBAN: { type: String },
		Date: { type: Date },
		reference: { type: String, unique: true },
		paymentMethod: { type: String },
		shippingMethod: { type: String },
		invoiceNumber: { type: Number },
		products: { type: Array },
		subtotal: { type: Number },
		total: { type: Number },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

exports.Invoice = Invoice;
