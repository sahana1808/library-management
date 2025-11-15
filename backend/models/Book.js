const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    category: { type: String, trim: true },
    availableCopies: { type: Number, default: 1, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
