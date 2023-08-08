const mongoose = require("mongoose");

const ipSchema = new mongoose.Schema(
  {
    ipAddress: String,
  },
  { timestamps: true }
);

const Ip = mongoose.model("Ip", ipSchema);

exports.Ip = Ip;
