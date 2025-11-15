const express = require("express");
const Request = require("../models/Request");
const Book = require("../models/Book");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// STUDENT: create a new book request
router.post("/requests", requireAuth, async (req, res) => {
  try {
    const { bookTitle, bookAuthor, notes, studentId } = req.body;

    if (!bookTitle) {
      return res.status(400).json({ error: "Book title is required" });
    }

    const request = new Request({
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentId: studentId || "",
      bookTitle,
      bookAuthor,
      notes
    });

    const saved = await request.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(400).json({ error: "Failed to create request" });
  }
});

// STUDENT: get own requests
router.get("/requests/me", requireAuth, async (req, res) => {
  try {
    const requests = await Request.find({ studentEmail: req.user.email }).sort({
      createdAt: -1
    });
    res.json(requests);
  } catch (err) {
    console.error("Error fetching own requests:", err);
    res.status(500).json({ error: "Failed to fetch your requests" });
  }
});

// ADMIN: get all requests (optionally filter by email)
router.get("/requests", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email } = req.query;
    let filter = {};
    if (email) filter.studentEmail = email;

    const requests = await Request.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// ADMIN: update request status
router.patch("/requests/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Approved", "Rejected", "Collected", "Returned"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Request not found" });

    res.json(updated);
  } catch (err) {
    console.error("Error updating request:", err);
    res.status(500).json({ error: "Failed to update request" });
  }
});

/* Books APIs (optional, can stay public for now) */
router.post("/books", requireAuth, requireAdmin, async (req, res) => {
  try {
    const book = new Book(req.body);
    const saved = await book.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating book:", err);
    res.status(400).json({ error: "Failed to create book" });
  }
});

router.get("/books", async (_req, res) => {
  try {
    const books = await Book.find().sort({ title: 1 });
    res.json(books);
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

module.exports = router;
