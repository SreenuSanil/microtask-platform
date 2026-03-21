import "./WorkerOverview.css";

const WorkerOverview = ({
  userData,
  availability,
  toggleAvailability,
  taskStats
}) => {

const taskSummary = [
  { label: "Waiting Payment", value: taskStats.waitingPayment },
  { label: "Ongoing Work", value: taskStats.ongoing },
  { label: "Pending Approval", value: taskStats.pendingApproval },
  { label: "Completed", value: taskStats.completed }
];

  return (
    <div className="overview-container">

      {/* Top Section */}
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

        {/* Stats Cards */}
        <div className="overview-stats-grid">

          <div className="overview-stat-card">
            <h4>Wallet Balance</h4>
            <p>₹{userData.walletBalance || 0}</p>
          </div>

          <div className="overview-stat-card">
            <h4>Total Earnings</h4>
            <p>₹{userData.totalEarnings}</p>
          </div>

          <div className="overview-stat-card">
            <h4>Completed Tasks</h4>
            <p>{userData.completedTasks}</p>
          </div>

          <div className="overview-stat-card">
            <h4>Ongoing Tasks</h4>
            <p>{userData.ongoingTasks || 0}</p>
          </div>

          <div className="overview-stat-card">
            <h4>Rating</h4>
            <p>{userData.rating} ⭐</p>
          </div>

        </div>

      </div>

      {/* Task Summary */}
      <div className="task-summary">

        <h3>Task Status Summary</h3>

        <div className="summary-grid">
          {taskSummary.map((t, i) => (
            <div key={i} className="overview-summary-card">
              <span className="summary-value">{t.value}</span>
              <span className="summary-label">{t.label}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

export default WorkerOverview;