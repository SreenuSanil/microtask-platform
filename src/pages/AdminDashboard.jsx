import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import logo from "../assets/tasknest.png";
import defaultAvatar from "../assets/default-avatar.png";


const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* =========================
     STATE
  ========================= */
  const [activeSection, setActiveSection] = useState("interviews");
  const [interviewWorkers, setInterviewWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [approvedWorkers, setApprovedWorkers] = useState([]);
  const [ratingMap, setRatingMap] = useState({});
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [providers, setProviders] = useState([]);
  const [providerTab, setProviderTab] = useState("active");
  
  
  const getProfileImage = (user) => {
  if (user.profileImage) {
    return `http://localhost:5000/${user.profileImage}`;
  }
  return defaultAvatar;
};

  /* =========================
     FETCH INTERVIEW WORKERS
  ========================= */
  const fetchInterviewWorkers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/interviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInterviewWorkers(data);
    } catch {
      console.error("Failed to fetch interview workers");
    }
  };

  useEffect(() => {
    if (activeSection === "interviews") {
      fetchInterviewWorkers();
      setSelectedWorkers([]);
    }
     if (activeSection === "workers") {
    fetchPendingWorkers();
    fetchWorkersByTab(activeTab);
  } 

   if (activeSection === "providers") {
  fetchProviders();
}

  }, [activeSection]);

  useEffect(() => {
  if (activeSection === "workers") {
    fetchWorkersByTab(activeTab);
  }
}, [activeTab]);

  /* =========================
     FILTER + SORT
     scheduled FIRST
  ========================= */
  const filteredWorkers = interviewWorkers
    .filter((w) =>
      w.skills?.toLowerCase().startsWith(skillSearch.toLowerCase())
    )
    .sort(
      (a, b) =>
        (b.interview?.interviewStatus === "scheduled") -
        (a.interview?.interviewStatus === "scheduled")
    );

  /* =========================
     SELECTION
  ========================= */
  const toggleWorkerSelection = (id) => {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedWorkers.length === filteredWorkers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(filteredWorkers.map((w) => w._id));
    }
  };

  /* =========================
     SCHEDULE INTERVIEW (ONCE)
  ========================= */
  const scheduleInterviewBulk = async () => {
    const eligible = interviewWorkers
      .filter(
        (w) =>
          selectedWorkers.includes(w._id) &&
          w.interview?.interviewStatus === "not_scheduled"
      )
      .map((w) => w._id);

    if (eligible.length === 0) {
      alert("Interview already scheduled for selected workers");
      return;
    }

    await fetch("http://localhost:5000/api/admin/interviews/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workerIds: eligible,
        interviewDate: new Date().toISOString().split("T")[0],
      }),
    });

    alert("Interview scheduled");
    fetchInterviewWorkers();
    setSelectedWorkers([]);
  };

  const scheduleSingleInterview = async (id) => {
    await fetch("http://localhost:5000/api/admin/interviews/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workerIds: [id],
        interviewDate: new Date().toISOString().split("T")[0],
      }),
    });

    alert("Interview scheduled");
    fetchInterviewWorkers();
  };

  /* =========================
     COMPLETE INTERVIEW
  ========================= */
  const markInterviewCompleted = async () => {
    const eligible = interviewWorkers
      .filter(
        (w) =>
          selectedWorkers.includes(w._id) &&
          w.interview?.interviewStatus === "scheduled"
      )
      .map((w) => w._id);

    if (eligible.length === 0) {
      alert("Only scheduled interviews can be completed");
      return;
    }

    await fetch("http://localhost:5000/api/admin/interviews/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workerIds: eligible }),
    });

    alert("Interview marked as completed");
    fetchInterviewWorkers();
    setSelectedWorkers([]);
  };

  /* =========================
   FETCH WORKERS FOR APPROVAL
========================= */
const fetchPendingWorkers = async () => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/admin/workers/pending",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setPendingWorkers(data);
  } catch {
    alert("Failed to load workers");
  }
};

const fetchWorkersByTab = async (tab) => {
  const status =
    tab === "active"
      ? "approved"
      : tab === "blocked"
      ? "blocked"
      : "removed";

  try {
    const res = await fetch(
      `http://localhost:5000/api/admin/workers?status=${status}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    setApprovedWorkers(data);
  } catch {
    console.log("Workers fetch failed");
  }
};


const approveWorker = async (workerId) => {
  const rating = ratingMap[workerId];
  if (!rating) {
    alert("Enter rating");
    return;
  }

  await fetch("http://localhost:5000/api/admin/workers/approve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workerId, rating }),
  });

  alert("Worker approved");
  fetchPendingWorkers();
  fetchWorkersByTab(activeTab);

};

const rejectWorker = async (workerId) => {
  if (!rejectReason) {
    alert("Enter rejection reason");
    return;
  }

  await fetch("http://localhost:5000/api/admin/workers/reject", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workerId, reason: rejectReason }),
  });

  alert("Worker rejected");
  setRejectReason("");
  fetchPendingWorkers();
};

const blockWorker = async (id) => {
  const daysInput = prompt(
    "Block for how many days?\nLeave empty for permanent block"
  );

  let days = null;

  if (daysInput !== null && daysInput.trim() !== "") {
    if (isNaN(daysInput) || Number(daysInput) <= 0) {
      alert("Please enter a valid number of days");
      return;
    }
    days = Number(daysInput);
  }

  const reason = prompt("Reason for blocking?");
  if (!reason || !reason.trim()) return;

  await fetch("http://localhost:5000/api/admin/workers/block", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workerId: id,
      reason,
      days, // null = permanent, number = timed
    }),
  });

  alert(
    days
      ? `Worker blocked for ${days} days`
      : "Worker permanently blocked"
  );

  fetchWorkersByTab(activeTab);

};



const unblockWorker = async (id) => {
  await fetch("http://localhost:5000/api/admin/workers/unblock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workerId: id }),
  });

  alert("Worker unblocked");
  fetchWorkersByTab(activeTab);

};

const removeWorker = async (id) => {
  const reason = prompt("Reason for removal?");
  if (!reason) return;

  await fetch("http://localhost:5000/api/admin/workers/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workerId: id, reason }),
  });

  alert("Worker removed");
fetchWorkersByTab(activeTab);

};

//provider

const fetchProviders = async () => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/admin/providers",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setProviders(data);
  } catch {
    alert("Failed to load providers");
  }
};

const blockProvider = async (id) => {
  const reason = prompt("Reason for blocking?");
  if (!reason) return;

  const days = prompt(
    "Block for how many days?\nLeave empty for permanent block"
  );

  await fetch("http://localhost:5000/api/admin/providers/block", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      providerId: id,
      reason,
      days: days ? Number(days) : null,
    }),
  });

  alert("Provider blocked");
  fetchProviders();
};


const unblockProvider = async (id) => {
  await fetch("http://localhost:5000/api/admin/providers/unblock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ providerId: id }),
  });

  alert("Provider unblocked");
  fetchProviders();
};

const removeProvider = async (id) => {
  const reason = prompt("Reason for removal?");
  if (!reason) return;

  await fetch("http://localhost:5000/api/admin/providers/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ providerId: id, reason }),
  });

  alert("Provider removed");
  fetchProviders();
};


  /* =========================
     MENU
  ========================= */
  const menuItems = [
    { id: "overview", label: "Dashboard Overview", icon: "📊" },
    { id: "interviews", label: "Interview Management", icon: "🎯" },
    { id: "workers", label: "Worker Management", icon: "👷" },
    { id: "providers", label: "Provider Management", icon: "🏢" },
    { id: "tasks", label: "Task Management", icon: "📋" },
    { id: "complaints", label: "Complaints & Disputes", icon: "⚖️" },
    { id: "revenue", label: "Revenue Analytics", icon: "💰" },
    { id: "settings", label: "System Settings", icon: "⚙️" },
  ];

  /* =========================
     RENDER
  ========================= */
const renderContent = () => {
  /* =========================
     INTERVIEW MANAGEMENT
  ========================= */
  if (activeSection === "interviews") {
    return (
      <>
        <div className="interview-toolbar">
          <input
            type="text"
            placeholder="Search skill (e.g. plumber)"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            className="skill-search"
          />

          <button className="bulk-btn" onClick={toggleSelectAll}>
            {selectedWorkers.length === filteredWorkers.length
              ? "Unselect All"
              : "Select All"}
          </button>

          <button className="bulk-primary" onClick={scheduleInterviewBulk}>
            Schedule Interview (Selected)
          </button>

          <button
            className="bulk-danger"
            onClick={markInterviewCompleted}
            disabled={selectedWorkers.length === 0}
          >
            Interview Completed
          </button>
        </div>

        <p className="selection-count">
          Selected: {selectedWorkers.length}
        </p>

        <div className="interview-grid">
          {filteredWorkers.map((worker) => (
            <div key={worker._id} className="interview-card">
  <img
    src={getProfileImage(worker)}
    alt={worker.name}
    className="profile-img"
  />

              <input
                type="checkbox"
                checked={selectedWorkers.includes(worker._id)}
                onChange={() => toggleWorkerSelection(worker._id)}
              />

              <span
                className={`badge ${
                  worker.interview?.interviewStatus === "scheduled"
                    ? "scheduled"
                    : "pending"
                }`}
              >
                {worker.interview?.interviewStatus === "scheduled"
                  ? "Interview Scheduled"
                  : "Not Scheduled"}
              </span>

              <h4>{worker.name}</h4>
              <p>{worker.email}</p>
              <p><b>Skill:</b> {worker.skills}</p>
              <p>{worker.city} - {worker.pincode}</p>

              <button
                className="approve-btn full-width"
                disabled={worker.interview?.interviewStatus !== "not_scheduled"}
                onClick={() => scheduleSingleInterview(worker._id)}
              >
                {worker.interview?.interviewStatus === "not_scheduled"
                  ? "Send Interview Details"
                  : "Interview Scheduled"}
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  /* =========================
     WORKER MANAGEMENT
  ========================= */
  if (activeSection === "workers") {
    return (
      <div className="worker-management">

        {/* Pending Approval */}
        <h2 className="section-title">
          Interview Completed – Pending Approval
        </h2>

        {pendingWorkers.length === 0 ? (
          <p className="empty-text">No workers pending approval</p>
        ) : (
          pendingWorkers.map(worker => (
<div key={worker._id} className="worker-card pending">

  {/* Profile Image */}
  <img
    src={
      worker.profileImage
        ? `http://localhost:5000/${worker.profileImage}`
        : defaultAvatar
    }
    alt={worker.name}
    className="profile-img"
  />

  <div className="worker-info">
    <h4>{worker.name}</h4>
    <p>{worker.email}</p>
    <p><b>Skill:</b> {worker.skills}</p>
    <p>{worker.city} - {worker.pincode}</p>
  </div>


              <div className="worker-actions">
                <input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="Rating (1–5)"
                  value={ratingMap[worker._id] || ""}
                  onChange={e =>
                    setRatingMap({
                      ...ratingMap,
                      [worker._id]: e.target.value,
                    })
                  }
                />

                <button
                  className="btn-approve"
                  onClick={() => approveWorker(worker._id)}
                >
                  Approve
                </button>

                <input
                  type="text"
                  placeholder="Reject reason"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />

                <button
                  className="btn-reject"
                  onClick={() => rejectWorker(worker._id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}

        {/* Approved Workers */}
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
  {approvedWorkers
    .filter(w =>
      activeTab === "active"
        ? w.accountStatus === "active"
        : activeTab === "blocked"
        ? w.accountStatus === "blocked"
        : w.accountStatus === "removed"
    )
    .map(worker => (
      <div key={worker._id} className="approved-card">
  <img
    src={getProfileImage(worker)}
    alt={worker.name}
    className="profile-img"
  />

        <div className="card-body">
          <h4>{worker.name}</h4>
          <p className="email">{worker.email}</p>

          <p><b>Skill:</b> {worker.skills}</p>
          <p><b>City:</b> {worker.city}</p>
          <p><b>Pincode:</b> {worker.pincode}</p>
          <p><b>Rating:</b> {worker.rating}</p>

          {/* SHOW REASON ONLY IN BLOCKED / REMOVED */}
{activeTab === "blocked" && (
  <>
    <p className="reason-text">
      <b>Blocked reason:</b>{" "}
      {worker.blockReason || "Not provided"}
    </p>

     <p className="reason-text">
      <b>Blocked until:</b>{" "}
      {worker.blockedUntil
        ? new Date(worker.blockedUntil).toLocaleDateString()
        : "Permanent"}
    </p>

    {worker.blockedUntil ? (
      <p className="reason-text timer">
        <b>Unblocks in:</b>{" "}
        {Math.max(
          0,
          Math.ceil(
            (new Date(worker.blockedUntil) - new Date()) /
              (1000 * 60 * 60 * 24)
          )
        )}{" "}
        day(s)
      </p>
    ) : (
      <p className="reason-text permanent">
        <b>Blocked until:</b> Permanent
      </p>
    )}
  </>
)}



          {activeTab === "removed" && (
            <p className="reason-text removed">
              <b>Removed reason:</b> {worker.removeReason || "Not provided"}
            </p>
          )}
        </div>

        <div className="card-actions">
          {activeTab === "active" && (
            <>
              <button
                className="btn-block"
                onClick={() => blockWorker(worker._id)}
              >
                Block
              </button>
              <button
                className="btn-remove"
                onClick={() => removeWorker(worker._id)}
              >
                Remove
              </button>
            </>
          )}

          {activeTab === "blocked" && (
            <>
              <button
                className="btn-unblock"
                onClick={() => unblockWorker(worker._id)}
              >
                Unblock
              </button>
              <button
                className="btn-remove"
                onClick={() => removeWorker(worker._id)}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
    ))}
</div>


      </div>
    );
  } 

  //provider MANAGEMENT

if (activeSection === "providers") {
  return (
    <div className="provider-management">
      <h2 className="section-title">Provider Management</h2>

      <div className="worker-tabs">
        <button
          className={providerTab === "active" ? "active" : ""}
          onClick={() => setProviderTab("active")}
        >
          Active
        </button>
        <button
          className={providerTab === "blocked" ? "active" : ""}
          onClick={() => setProviderTab("blocked")}
        >
          Blocked
        </button>
        <button
          className={providerTab === "removed" ? "active" : ""}
          onClick={() => setProviderTab("removed")}
        >
          Removed
        </button>
      </div>

      <div className="provider-grid">
        {providers
          .filter(p =>
            providerTab === "active"
              ? p.accountStatus === "active"
              : providerTab === "blocked"
              ? p.accountStatus === "blocked"
              : p.accountStatus === "removed"
          )
          .map(provider => (
            <div key={provider._id} className="provider-card">
  <img
    src={getProfileImage(provider)}
    alt={provider.name}
    className="profile-img"
  />

              <h4>{provider.name}</h4>
              <p>{provider.email}</p>
              <p><b>City:</b> {provider.city}</p>
              <p><b>Pincode:</b> {provider.pincode}</p>
              <p><b>Organization:</b> {provider.organization}</p>

              {/* BLOCKED DETAILS */}
              {providerTab === "blocked" && (
                <>
                  <p className="reason-text">
                    <b>Blocked reason:</b>{" "}
                    {provider.blockReason || "Not provided"}
                  </p>

                  <p className="reason-text">
                    <b>Blocked until:</b>{" "}
                    {provider.blockedUntil
                      ? new Date(provider.blockedUntil).toLocaleDateString()
                      : "Permanent"}
                  </p>

                  {provider.blockedUntil && (
                    <p className="reason-text">
                      <b>Remaining:</b>{" "}
                      {Math.ceil(
                        (new Date(provider.blockedUntil) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </p>
                  )}
                </>
              )}

              {/* REMOVED DETAILS */}
              {providerTab === "removed" && (
                <p className="reason-text removed">
                  <b>Removed reason:</b>{" "}
                  {provider.removeReason || "—"}
                </p>
              )}

              <div className="card-actions">
                {providerTab === "active" && (
                  <>
                    <button
                      className="btn-block"
                      onClick={() => blockProvider(provider._id)}
                    >
                      Block
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => removeProvider(provider._id)}
                    >
                      Remove
                    </button>
                  </>
                )}

                {providerTab === "blocked" && (
                  <>
                    <button
                      className="btn-unblock"
                      onClick={() => unblockProvider(provider._id)}
                    >
                      Unblock
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => removeProvider(provider._id)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}


  /* =========================
     OTHER SECTIONS
  ========================= */
  return (
    <div className="coming-soon">
      <h2>{menuItems.find(m => m.id === activeSection)?.label}</h2>
      <p>This section is under development</p>
    </div>
  );
};



  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <img src={logo} alt="TaskNest" className="admin-logo" />
          <h1>Admin Dashboard</h1>
        </div>
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar">
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`menu-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </aside>

        <main className="admin-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
