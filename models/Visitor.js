const mongoose = require("mongoose");


const visitorSchema = new mongoose.Schema(
  {
		count: Number,
		name: String
  },
);

const Visitor = mongoose.model("Visitor", visitorSchema);

exports.Visitor = Visitor;
