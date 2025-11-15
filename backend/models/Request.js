const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true },
    studentId: { type: String, trim: true },
    bookTitle: { type: String, required: true, trim: true },
    bookAuthor: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Collected", "Returned"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
