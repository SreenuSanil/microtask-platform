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

  const getProfileImage = (user) => {
    if (user.profileImage) {
      return `http://localhost:5000/${user.profileImage}`;
    }
    return defaultAvatar;
  };

  /* FETCH */
  const fetchPendingWorkers = async () => {
    const res = await fetch(
      "http://localhost:5000/api/admin/workers/pending",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setPendingWorkers(data);
  };

  const fetchWorkersByTab = async (tab) => {
    const status =
      tab === "active" ? "approved" : tab === "blocked" ? "blocked" : "removed";

    const res = await fetch(
      `http://localhost:5000/api/admin/workers?status=${status}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    setApprovedWorkers(data);
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
      rating: Number(ratingMap[`${workerId}-${skill}`]),
    }));

    await fetch("http://localhost:5000/api/admin/workers/approve", {
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

    await fetch("http://localhost:5000/api/admin/workers/reject", {
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
    const reason = prompt("Reason?");
    if (!reason) return;

    await fetch("http://localhost:5000/api/admin/workers/block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workerId: id, reason }),
    });

    fetchWorkersByTab(activeTab);
  };

  const removeWorker = async (id) => {
    const reason = prompt("Reason?");
    if (!reason) return;

    await fetch("http://localhost:5000/api/admin/workers/remove", {
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
            <img
              src={getProfileImage(worker)}
              className="profile-img"
            />

            <div className="pending-info">
              <h4>{worker.name}</h4>
              <p className="email">{worker.email}</p>
              <p><strong>Skill:</strong> {worker.skills?.join(", ")}</p>
              <p><strong>Location:</strong> {worker.address}</p>
            </div>
          </div>

          <div className="pending-actions">

            {/* SKILL RATING */}
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

      <div className="worker-tabs">
        <button
          className={activeTab === "active" ? "active" : ""}
          onClick={() => setActiveTab("active")}
        >
          Active
        </button>
        <button
          className={activeTab === "blocked" ? "active" : ""}
          onClick={() => setActiveTab("blocked")}
        >
          Blocked
        </button>
        <button
          className={activeTab === "removed" ? "active" : ""}
          onClick={() => setActiveTab("removed")}
        >
          Removed
        </button>
      </div>

      <div className="approved-grid">
        {approvedWorkers.map((worker) => (
          <div key={worker._id} className="approved-card">

            <span className={`status-badge ${worker.accountStatus}`}>
              {worker.accountStatus?.toUpperCase()}
            </span>

            <div className="card-top">
              <img
                src={getProfileImage(worker)}
                className="profile-img"
              />
              <div className="worker-main">
                <h4>{worker.name}</h4>
                <p className="email">{worker.email}</p>
              </div>
            </div>

<div className="card-details">

  <p><strong>Skill:</strong> {worker.skills?.join(", ")}</p>

  <p><strong>Location:</strong> {worker.address}</p>

  <p className="rating">
    ⭐ {worker.overallRating > 0 
        ? worker.overallRating.toFixed(1) 
        : "Not Rated"}
  </p>

  {worker.skillRatings?.map((r) => (
    <p key={r.skill} className="skill-rating-line">
      {r.skill}: ⭐ {r.ratingAverage.toFixed(1)}
    </p>
  ))}

</div>

            <div className="card-actions">
              <button className="btn-block" onClick={() => blockWorker(worker._id)}>
                Block
              </button>
              <button className="btn-remove" onClick={() => removeWorker(worker._id)}>
                Remove
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default AdminWorkers;