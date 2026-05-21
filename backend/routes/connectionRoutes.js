const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  sendConnectionRequest,
  checkConnection,
  acceptConnection,
  rejectConnection,
  closeConnection,
  getWorkerInvitations,
  getProviderInvites,
  getMyChats,
  confirmConnection,
  workerConfirm,
  updateBudget,
  markProviderSeen,
  markWorkerSeen
} = require("../controllers/connectionController");

/* =========================
   CONNECTION REQUEST
========================= */

router.post("/request", protect, sendConnectionRequest);

router.get("/check", protect, checkConnection);


/* =========================
   INVITATIONS
========================= */

router.get("/worker-invitations", protect, getWorkerInvitations);

router.get("/provider-invites", protect, getProviderInvites);


/* =========================
   CONNECTION ACTIONS
========================= */

router.patch("/:id/accept", protect, acceptConnection);

router.patch("/:id/reject", protect, rejectConnection);

router.patch("/:id/close", protect, closeConnection);


/* =========================
   CHAT
========================= */

router.get("/my-chats", protect, getMyChats);


/* =========================
   JOB CONFIRMATION
========================= */

router.patch("/confirm/:connectionId", protect, confirmConnection);

router.patch("/worker-confirm/:id", protect, workerConfirm);


/* =========================
   BUDGET UPDATE
========================= */

router.patch("/update-budget/:id", protect, updateBudget);

/* =========================
   SEEN STATUS
========================= */

router.patch("/:id/provider-seen", protect, markProviderSeen);

router.patch("/:id/worker-seen", protect, markWorkerSeen);

module.exports = router;