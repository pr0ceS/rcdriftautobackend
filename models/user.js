const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 3, maxlength: 30 },
    email: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 200,
      unique: true,
    },
    password: { type: String, required: true, minlength: 3, maxlength: 1024 },
    isAdmin: { type: Boolean, default: false },
		isCompany: { type: Boolean, default: false },
		company: String,
    straat: String,
    huisnummer: String,
    postcode: String,
    stad: String,
		UST: { type: String },
    phoneNumber: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

exports.User = User;
