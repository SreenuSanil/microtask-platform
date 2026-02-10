import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProviderDashboard.css";
import logo from "../assets/tasknest.png";
import PostTask from "./provider/PostTask";


const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const [userData, setUserData] = useState({
    name: "",
    organization: "",
    email: "",
  });

  /* =========================
     FETCH PROVIDER PROFILE
  ========================= */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch provider profile");
      }
    };

    fetchUser();
  }, []);

  /* =========================
     SIDEBAR MENU (PROVIDER ONLY)
  ========================= */
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: "📊" },
    { id: "post-task", label: "Post Task", icon: "➕" },
    { id: "my-tasks", label: "My Tasks", icon: "📋" },
    { id: "workers", label: "Workers", icon: "👷" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  /* =========================
     CONTENT RENDERER
  ========================= */
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-grid">
            <div className="stat-card">
              <h3>Total Tasks Posted</h3>
              <p className="stat-value">0</p>
            </div>

            <div className="stat-card">
              <h3>Active Tasks</h3>
              <p className="stat-value">0</p>
            </div>

            <div className="stat-card">
              <h3>Completed Tasks</h3>
              <p className="stat-value">0</p>
            </div>

            <div className="stat-card">
              <h3>Total Spent</h3>
              <p className="stat-value">₹0</p>
            </div>
          </div>
        );

      case "post-task":
        return <PostTask />;
         
        

      case "my-tasks":
        return (
          <div>
            <h2>My Tasks</h2>
            <p>You have not posted any tasks yet.</p>
          </div>
        );

      case "workers":
        return (
          <div>
            <h2>Workers</h2>
            <p>Assigned and applied workers will appear here.</p>
          </div>
        );

      case "payments":
        return (
          <div>
            <h2>Payments</h2>
            <p>Payment history and wallet will be enabled later.</p>
          </div>
        );

      case "notifications":
        return (
          <div>
            <h2>Notifications</h2>
            <p>No notifications yet.</p>
          </div>
        );

      case "profile":
        return (
          <div>
            <h2>Profile</h2>
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Organization:</strong> {userData.organization}</p>
            <p><strong>Role:</strong> Provider</p>
          </div>
        );

      default:
        return null;
    }
  };

  /* =========================
     FORMAT NAME
  ========================= */
  const formatName = (name = "") =>
    name
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  /* =========================
     UI
  ========================= */
  return (
    <div className="provider-dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <img src={logo} alt="TaskNest Logo" className="dashboard-logo" />

          <div className="welcome-box">
            <div className="welcome-title">
              Welcome,{" "}
              <span className="welcome-name">
                {formatName(userData.name)}
              </span>{" "}
              👋
            </div>
            <div className="welcome-sub">
              Manage tasks & local workers
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

      {/* CONTENT */}
      <div className="dashboard-content">
        <aside className="sidebar">
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`menu-item ${
                activeSection === item.id ? "active" : ""
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </div>
          ))}
        </aside>

        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ProviderDashboard;
