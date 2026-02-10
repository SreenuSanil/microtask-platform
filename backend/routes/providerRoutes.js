const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const { createTask } = require("../controllers/providerController");

// POST TASK
router.post("/tasks", verifyToken, createTask);

module.exports = router;
