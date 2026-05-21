import { useEffect, useState } from "react";
import "./WorkerOverview.css";

const WorkerOverview = ({ availability, toggleAvailability }) => {

  const token = localStorage.getItem("token");

  const [data, setData] = useState({
    walletBalance: 0,
    totalEarnings: 0,
    completed: 0,
    ongoing: 0,
    pendingApproval: 0,
    waitingPayment: 0,
    disputes: 0
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(
          "https://microtask-platform-backend-y3xo.onrender.com/api/tasks/worker-dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const result = await res.json();

        if (res.ok) setData(result);

      } catch (err) {
        console.log("Dashboard fetch failed");
      }
    };

    fetchDashboard();
  }, [token]);

  return (
    <div className="overview-container">

      {/* ================= TOP ================= */}
      <div className="overview-top">

        {/* Availability */}
        <div className="availability-section">
          <h3>Availability</h3>

          <button
            className={`availability-btn ${
              availability.active ? "on" : "off"
            }`}
            onClick={toggleAvailability}
          >
            {availability.active ? "Available" : "Unavailable"}
          </button>

          <p className="availability-note">
            Toggle when you are ready to receive tasks
          </p>
        </div>

        {/* Stats */}
        <div className="overview-stats-grid">

          <div className="overview-stat-card">
            <h4>Wallet Balance</h4>
            <p>₹{Number(data.walletBalance).toFixed(2)}</p>
          </div>

          <div className="overview-stat-card">
            <h4>Total Earnings</h4>
            <p>₹{Number(data.totalEarnings).toFixed(2)}</p>
          </div>

        </div>

      </div>

      {/* ================= TASK STATUS ================= */}
      <div className="task-summary">

        <h3>Task Status Overview</h3>

<div className="summary-grid">

  <div className="overview-summary-card waiting">
    <span className="summary-icon">💰</span>
    <span className="summary-value">{data.waitingPayment}</span>
    <span className="summary-label">Waiting Payment</span>
  </div>

  <div className="overview-summary-card ongoing">
    <span className="summary-icon">⚙️</span>
    <span className="summary-value">{data.ongoing}</span>
    <span className="summary-label">Ongoing Work</span>
  </div>

  <div className="overview-summary-card pending">
    <span className="summary-icon">⏳</span>
    <span className="summary-value">{data.pendingApproval}</span>
    <span className="summary-label">Pending Approval</span>
  </div>

  <div className="overview-summary-card completed">
    <span className="summary-icon">✅</span>
    <span className="summary-value">{data.completed}</span>
    <span className="summary-label">Completed</span>
  </div>

  <div className="overview-summary-card dispute">
    <span className="summary-icon">⚠️</span>
    <span className="summary-value">{data.disputes}</span>
    <span className="summary-label">Disputes</span>
  </div>

</div>

      </div>

    </div>
  );
};

export default WorkerOverview;