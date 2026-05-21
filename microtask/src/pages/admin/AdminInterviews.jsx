import { useState, useEffect } from "react";
import "./AdminInterviews.css";
import defaultAvatar from "../../assets/default-avatar.png";

const AdminInterviews = () => {
  const token = localStorage.getItem("token");

  const [interviewWorkers, setInterviewWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [interviewLocation, setInterviewLocation] = useState("");
  const [currentWorker, setCurrentWorker] = useState(null);
  const getProfileImage = (user) => {
    if (user.profileImage) {
      return `https://microtask-platform-backend-y3xo.onrender.com/${user.profileImage}`;
    }
    return defaultAvatar;
  };

  /* ================= FETCH ================= */
  const fetchInterviewWorkers = async () => {
    try {
      const res = await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/interviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInterviewWorkers(data);
    } catch {
      console.error("Failed to fetch interview workers");
    }
  };

  useEffect(() => {
    fetchInterviewWorkers();
    setSelectedWorkers([]);
  }, []);

  /* ================= FILTER ================= */
  const filteredWorkers = interviewWorkers
    .filter((w) =>
      w.skills?.some((skill) =>
        skill.toLowerCase().startsWith(skillSearch.toLowerCase())
      )
    )
    .sort(
      (a, b) =>
        (b.interview?.interviewStatus === "scheduled") -
        (a.interview?.interviewStatus === "scheduled")
    );

  /* ================= SELECT ================= */
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

  /* ================= ACTIONS ================= */
const scheduleInterviewBulk = async () => {
if (!interviewDate || !interviewTime || !interviewLocation) {
  alert("Please fill all fields");
  return;
}

// ❌ PAST DATE/TIME BLOCK
const selected = new Date(`${interviewDate}T${interviewTime}`);
const now = new Date();

if (selected < now) {
  alert("Cannot select past date/time");
  return;
}

  const eligible = interviewWorkers
    .filter(
      (w) =>
        selectedWorkers.includes(w._id) &&
        w.interview?.interviewStatus === "not_scheduled"
    )
    .map((w) => w._id);

  if (eligible.length === 0) {
    alert("Interview already scheduled");
    return;
  }

  await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/interviews/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workerIds: eligible,
      interviewDate,
       interviewTime,
       interviewLocation,
    }),
  });

  alert("Interview scheduled");
  fetchInterviewWorkers();
  setSelectedWorkers([]);
};

const scheduleSingleInterview = async (id) => {
if (!interviewDate || !interviewTime || !interviewLocation) {
  alert("Please fill all fields");
  return;
}

// ❌ PAST DATE/TIME BLOCK
const selected = new Date(`${interviewDate}T${interviewTime}`);
const now = new Date();

if (selected < now) {
  alert("Cannot select past date/time");
  return;
}

  await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/interviews/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workerIds: [id],
      interviewDate,
      interviewTime,
      interviewLocation,
    }),
  });

  alert("Interview scheduled");
  fetchInterviewWorkers();
};

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

    await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/interviews/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workerIds: eligible }),
    });

    alert("Completed");
    fetchInterviewWorkers();
    setSelectedWorkers([]);
  };

  return (
    <>
<div className="interview-toolbar">
  <input
    type="text"
    placeholder="Search skill (e.g plumber)"
    value={skillSearch}
    onChange={(e) => setSkillSearch(e.target.value)}
    className="skill-search"
  />

  <button className="bulk-btn" onClick={toggleSelectAll}>
    Select All
  </button>

<button
  className="bulk-primary"
  onClick={() => {
    setCurrentWorker(null);
    setShowModal(true);
  }}
>
  Send Interview Invite
</button>

  <button className="bulk-danger" onClick={markInterviewCompleted}>
    Mark as Interviewed
  </button>


</div>

      <p>Selected: {selectedWorkers.length}</p>

      <div className="interview-grid">
        {filteredWorkers.map((worker) => (
          <div key={worker._id} className="interview-card">

            <input
              type="checkbox"
              checked={selectedWorkers.includes(worker._id)}
              onChange={() => toggleWorkerSelection(worker._id)}
            />

<span className={`badge ${
  worker.interview?.interviewStatus === "scheduled"
    ? "scheduled"
    : "pending"
}`}>
  {worker.interview?.interviewStatus === "scheduled"
    ? "Interview Scheduled"
    : "Pending Interview"}
</span>

            <img
              src={getProfileImage(worker)}
              alt=""
              className="profile-img"
            />

            <h4>{worker.name}</h4>
            <p>{worker.email}</p>
            <p>{worker.skills?.join(", ")}</p>

            <button
              disabled={worker.interview?.interviewStatus !== "not_scheduled"}
              onClick={() => {
  setCurrentWorker(worker._id);
  setShowModal(true);
}}
            >
              Schedule
            </button>

          </div>
        ))}
      </div>


{showModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3>Schedule Interview</h3>

      <input
        type="date"
        value={interviewDate}
        onChange={(e) => setInterviewDate(e.target.value)}
      />

      <input
        type="time"
        value={interviewTime}
        onChange={(e) => setInterviewTime(e.target.value)}
      />

      <input
        type="text"
        placeholder="Enter interview location"
        value={interviewLocation}
        onChange={(e) => setInterviewLocation(e.target.value)}
      />

      <div className="modal-actions">
        <button onClick={() => setShowModal(false)}>Cancel</button>

        <button
          onClick={() => {
            if (currentWorker) {
              scheduleSingleInterview(currentWorker);
            } else {
              scheduleInterviewBulk();
            }
            setShowModal(false);
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
};

export default AdminInterviews;