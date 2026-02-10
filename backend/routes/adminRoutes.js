const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const {
  getInterviewCandidates,
  scheduleInterview,
  completeInterview,
  getWorkersForApproval,
  getWorkersByStatus,
  approveWorker,
  rejectWorker,
  blockWorker,
  unblockWorker,
  removeWorker,
  getApprovedProviders,
  blockProvider,
  unblockProvider,
  removeProvider,
 

} = require("../controllers/adminController");

/* =========================
   INTERVIEW MANAGEMENT
========================= */

// get workers for interview
router.get("/interviews", auth, admin, getInterviewCandidates);

// schedule interview
router.post("/interviews/schedule", auth, admin, scheduleInterview);

// mark interview completed
router.post("/interviews/complete", auth, admin, completeInterview);

/* =========================
   WORKER MANAGEMENT
========================= */

// workers whose interview is completed (pending approval)
router.get("/workers/pending", auth, admin, getWorkersForApproval);

// fetch workers by status (approved)
router.get("/workers", auth, admin, getWorkersByStatus);

// approve worker
router.post("/workers/approve", auth, admin, approveWorker);

// reject worker
router.post("/workers/reject", auth, admin, rejectWorker);

router.post("/workers/block", auth, admin, blockWorker);
router.post("/workers/unblock", auth, admin, unblockWorker);
router.post("/workers/remove", auth, admin, removeWorker);


/* =========================
   PROVIDER MANAGEMENT
========================= */

// fetch approved providers
router.get("/providers", auth, admin, getApprovedProviders);

// block provider
router.post("/providers/block", auth, admin, blockProvider);

// unblock provider
router.post("/providers/unblock", auth, admin, unblockProvider);

// remove provider
router.post("/providers/remove", auth, admin, removeProvider);



module.exports = router;
