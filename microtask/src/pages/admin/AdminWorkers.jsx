import { useState, useEffect } from "react";
import "./AdminWorkers.css";
import defaultAvatar from "../../assets/default-avatar.png";

const AdminWorkers = () => {
  const token = localStorage.getItem("token");

  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [approvedWorkers, setApprovedWorkers] = useState([]);
  const [ratingMap, setRatingMap] = useState({});
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockDate, setBlockDate] = useState("");
  const getProfileImage = (user) => {
    if (user.profileImage) {
      return `https://microtask-platform-backend-y3xo.onrender.com/${user.profileImage}`;
    }
    return defaultAvatar;
  };

  /* FETCH */
  const fetchPendingWorkers = async () => {
    const res = await fetch(
      "https://microtask-platform-backend-y3xo.onrender.com/api/admin/workers/pending",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setPendingWorkers(data);
  };

  const fetchWorkersByTab = async (tab) => {
    const status =
      tab === "active" ? "approved" : tab === "blocked" ? "blocked" : "removed";

    const res = await fetch(
      `https://microtask-platform-backend-y3xo.onrender.com/api/admin/workers?status=${status}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    setApprovedWorkers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchPendingWorkers();
    fetchWorkersByTab(activeTab);
  }, []);

  useEffect(() => {
    fetchWorkersByTab(activeTab);
  }, [activeTab]);

  /* ACTIONS */
  const approveWorker = async (workerId, skills) => {
    const ratings = skills.map((skill) => ({
      skill,
      rating: Math.min(
        5,
        Math.max(1, Number(ratingMap[`${workerId}-${skill}`]))
      ),
    }));

    await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/workers/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workerId, ratings }),
    });

    fetchPendingWorkers();
    fetchWorkersByTab(activeTab);
  };

  const rejectWorker = async (workerId) => {
    if (!rejectReason) return;

    await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/workers/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workerId, reason: rejectReason }),
    });

    setRejectReason("");
    fetchPendingWorkers();
  };

 const blockWorker = async (id) => {
  const reason = prompt("Enter reason for blocking:");
  if (!reason) return;

  const daysInput = prompt("Block for how many days? (leave empty for permanent)");

  let days = null;

  if (daysInput) {
    days = Number(daysInput);
    if (isNaN(days) || days <= 0) {
      alert("Invalid number of days");
      return;
    }
  }

  await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/workers/block", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workerId: id,
      reason,
      days, // ✅ NEW
    }),
  });

  fetchWorkersByTab(activeTab);
};

  const unblockWorker = async (id) => {
  await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/workers/unblock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workerId: id }),
  });

  fetchWorkersByTab(activeTab);
};

const submitBlock = async () => {
  if (!blockReason) {
    alert("Enter reason");
    return;
  }

  let days = null;

  if (blockDate) {
    const selected = new Date(blockDate);
    const today = new Date();

    const diffTime = selected - today;
    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/workers/block", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workerId: selectedWorker,
      reason: blockReason,
      days,
    }),
  });

  setShowBlockModal(false);
  setBlockReason("");
  setBlockDate("");

  fetchWorkersByTab(activeTab);
};

  const removeWorker = async (id) => {
    const reason = prompt("Reason?");
    if (!reason) return;

    await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/workers/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workerId: id, reason }),
    });

    fetchWorkersByTab(activeTab);
  };

  return (
    <div className="worker-management">

      {/* PENDING */}
      <h2 className="section-title">
        Interview Completed – Pending Approval
      </h2>

      {pendingWorkers.map((worker) => (
        <div key={worker._id} className="pending-card">

          <div className="pending-left">
            <img src={getProfileImage(worker)} className="profile-img" />

            <div className="pending-info">
              <h4>{worker.name}</h4>
              <p className="email">{worker.email}</p>
              <p><strong>Skill:</strong> {worker.skills?.join(", ")}</p>
              <p><strong>Location:</strong> {worker.address}</p>
            </div>
          </div>

          <div className="pending-actions">
            <div className="skill-rating-container">
              {worker.skills?.map((skill) => (
                <div key={skill} className="skill-rating-box">
                  <label>{skill}</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    placeholder="Rate 1-5"
                    value={ratingMap[`${worker._id}-${skill}`] || ""}
                    onChange={(e) =>
                      setRatingMap({
                        ...ratingMap,
                        [`${worker._id}-${skill}`]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <button
              className="approve-btn-modern"
              onClick={() => approveWorker(worker._id, worker.skills)}
            >
              Approve
            </button>

            <input
              type="text"
              placeholder="Reject reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <button
              className="reject-btn-modern"
              onClick={() => rejectWorker(worker._id)}
            >
              Reject
            </button>
          </div>
        </div>
      ))}

      {/* APPROVED */}
      <h2 className="section-title">Approved Workers</h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="worker-tabs">
        <button className={activeTab === "active" ? "active" : ""} onClick={() => setActiveTab("active")}>Active</button>
        <button className={activeTab === "blocked" ? "active" : ""} onClick={() => setActiveTab("blocked")}>Blocked</button>
        <button className={activeTab === "removed" ? "active" : ""} onClick={() => setActiveTab("removed")}>Removed</button>
      </div>

      <div className="approved-grid">
        {approvedWorkers
          .filter((worker) =>
            worker.name?.toLowerCase().includes(search.toLowerCase())
          )
          .map((worker) => {
const highlightId = localStorage.getItem("highlightUser");
const isHighlighted = highlightId === worker._id;
            const totalTasks = worker.completedTasks + worker.cancelCount;

            const cancelRate =
              totalTasks > 0
                ? (worker.cancelCount / totalTasks) * 100
                : 0;

            return (
              <div
  key={worker._id}
  className={`approved-card ${isHighlighted ? "highlight-card" : ""}`}
>

                <span className={`status-badge ${worker.accountStatus}`}>
                  {worker.accountStatus?.toUpperCase()}
                </span>

                <div className="card-top">
                  <img src={getProfileImage(worker)} className="profile-img" />
                  <div className="worker-main">
                    <h4>{worker.name}</h4>
                    <p className="email">{worker.email}</p>
                  </div>
                </div>

                <div className="card-details">
                  <p><strong>Skill:</strong> {worker.skills?.join(", ")}</p>
                  <p><strong>Location:</strong> {worker.address}</p>

                  {/* ✅ NEW CANCEL RATE */}
                  <p
                    className={`cancel-count ${
                      cancelRate > 15
                        ? "danger"
                        : cancelRate > 5
                        ? "warning"
                        : ""
                    }`}
                  >
                    Cancels: {worker.cancelCount} ({cancelRate.toFixed(1)}%)
                  </p>

                  <p className="rating">
                    ⭐ {worker.overallRating > 0
                      ? worker.overallRating.toFixed(1)
                      : "Not Rated"}
                  </p>
                  {worker.blockedUntil && (
  <p className="blocked-until">
    Blocked Until: {new Date(worker.blockedUntil).toLocaleDateString()}
  </p>
)}
                </div>

<div className="card-actions">

  {worker.accountStatus === "blocked" ? (
    <button
      className="btn-unblock"
      onClick={() => unblockWorker(worker._id)}
    >
      Unblock
    </button>
  ) : (
<button
  className="btn-block"
  onClick={() => {
    setSelectedWorker(worker._id);
    setShowBlockModal(true);
  }}
>
  Block
</button>
  )}

  <button
    className="btn-remove"
    onClick={() => removeWorker(worker._id)}
  >
    Remove
  </button>

</div>

              </div>
            );
          })}
      </div>

      {showBlockModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3>Block Worker</h3>

      <input
        type="text"
        placeholder="Enter reason"
        value={blockReason}
        onChange={(e) => setBlockReason(e.target.value)}
      />

      <label>Block Until (optional)</label>
      <input
        type="date"
        value={blockDate}
        onChange={(e) => setBlockDate(e.target.value)}
      />

      <div className="modal-actions">
        <button className="btn-submit" onClick={submitBlock}>
          Confirm
        </button>

        <button
          className="btn-cancel"
          onClick={() => setShowBlockModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};


export default AdminWorkers;