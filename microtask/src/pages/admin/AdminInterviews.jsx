import { useState, useEffect } from "react";
import "./AdminInterviews.css";
import defaultAvatar from "../../assets/default-avatar.png";

const AdminInterviews = () => {
  const token = localStorage.getItem("token");

  const [interviewWorkers, setInterviewWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");

  const getProfileImage = (user) => {
    if (user.profileImage) {
      return `http://localhost:5000/${user.profileImage}`;
    }
    return defaultAvatar;
  };

  /* ================= FETCH ================= */
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

  <button className="bulk-primary" onClick={scheduleInterviewBulk}>
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
              onClick={() => scheduleSingleInterview(worker._id)}
            >
              Schedule
            </button>

          </div>
        ))}
      </div>
    </>
  );
};

export default AdminInterviews;