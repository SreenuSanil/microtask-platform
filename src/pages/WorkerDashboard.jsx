import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./WorkerDashboard.css";
import logo from "../assets/tasknest.png";

const AVAILABILITY_LIMIT = 48 * 60 * 60 * 1000; // 48 hours

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const [userData, setUserData] = useState({
    name: "Worker",
    rating: 4.4,
    totalEarnings: 4200,
    completedTasks: 18
  });

  const [availability, setAvailability] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("availability"));
    return saved || { active: false, time: null };
  });

  const [ongoingTasks] = useState([]);
  const [taskHistory] = useState([]);
  const [messages] = useState([]);
  const [notifications] = useState([]);
  const [reviews] = useState([]);

  /* AUTO EXPIRE AVAILABILITY */
  useEffect(() => {
    if (availability.active && availability.time) {
      const now = Date.now();
      if (now - availability.time > AVAILABILITY_LIMIT) {
        setAvailability({ active: false, time: null });
        localStorage.removeItem("availability");
      }
    }
  }, [availability]);

  const toggleAvailability = () => {
    if (!availability.active) {
      const data = { active: true, time: Date.now() };
      setAvailability(data);
      localStorage.setItem("availability", JSON.stringify(data));
    } else {
      setAvailability({ active: false, time: null });
      localStorage.removeItem("availability");
    }
  };

  const formatName = name =>
    name
      .toLowerCase()
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-grid">
            <div className="stat-card">
              <h3>Total Earnings</h3>
              <p className="stat-value">₹{userData.totalEarnings}</p>
            </div>

            <div className="stat-card">
              <h3>Completed Tasks</h3>
              <p className="stat-value">{userData.completedTasks}</p>
            </div>

            <div className="stat-card">
              <h3>Rating</h3>
              <p className="stat-value">{userData.rating} ⭐</p>
            </div>

            <div className="stat-card availability-card">
              <h3>Availability</h3>
              <button
                className={`availability-btn ${
                  availability.active ? "on" : "off"
                }`}
                onClick={toggleAvailability}
              >
                {availability.active ? "Available" : "Unavailable"}
              </button>
              {availability.active && (
                <p className="availability-note">
                  Active for 48 hours
                </p>
              )}
            </div>
          </div>
        );

      case "ongoing":
        return <h2>No ongoing tasks right now</h2>;

      case "history":
        return <h2>Task history will appear here</h2>;

      case "earnings":
        return (
          <div>
            <h2>Earnings & Wallet</h2>
            <p>Wallet balance: ₹{userData.totalEarnings}</p>
            <p>Withdrawals will be enabled later</p>
          </div>
        );

      case "messages":
        return (
          <div>
            <h2>Messages</h2>
            {messages.length === 0 ? <p>No messages yet</p> : null}
          </div>
        );

      case "notifications":
        return (
          <div>
            <h2>Notifications</h2>
            {notifications.length === 0 ? <p>No notifications</p> : null}
          </div>
        );

      case "ratings":
        return (
          <div>
            <h2>Ratings & Reviews</h2>
            {reviews.length === 0 ? <p>No reviews yet</p> : null}
          </div>
        );

      case "profile":
        return (
          <div>
            <h2>Your Profile</h2>
            <p><strong>Name:</strong> {formatName(userData.name)}</p>
            <p><strong>Status:</strong> Approved</p>
          </div>
        );

      default:
        return <h2>Coming soon</h2>;
    }
  };

  const menuItems = [
    { id: "overview", label: "Dashboard Overview", icon: "📊" },
    { id: "ongoing", label: "Ongoing Tasks", icon: "⚡" },
    { id: "history", label: "Task History", icon: "📜" },
    { id: "earnings", label: "Earnings / Wallet", icon: "💰" },
    { id: "messages", label: "Chat / Messages", icon: "💬" },
    { id: "ratings", label: "Ratings & Reviews", icon: "⭐" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "profile", label: "Profile", icon: "👤" }
  ];

  return (
    <div className="worker-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={logo} alt="TaskNest" className="dashboard-logo" />
          <div>
            <div className="welcome-title">
              Welcome, <span className="welcome-name">{formatName(userData.name)}</span> 👋
            </div>
            <div className="welcome-sub">
              Manage your work & availability
            </div>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`menu-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </aside>

        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default WorkerDashboard;
