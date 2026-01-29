import { useState, useEffect } from "react";
import "./WorkerDashboard.css";
import logo from "../assets/tasknest.png";

const WorkerDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview"); 

   const [userData, setUserData] = useState({
    name: "Loading..."
  });

  //fetching user data
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
        console.error("Failed to fetch user");
      }
    };

    fetchUser();
  }, []);

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "available", label: "Available Tasks", icon: "📋" },
    { id: "ongoing", label: "Ongoing Tasks", icon: "⚡" },
    { id: "completed", label: "Completed Tasks", icon: "✅" },
    { id: "earnings", label: "Earnings", icon: "💰" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "settings", label: "Settings", icon: "⚙️" }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-grid">
            <div className="stat-card">
              <h3>Total Earnings</h3>
              <p className="stat-value">₹0</p>
            </div>
            <div className="stat-card">
              <h3>Completed Tasks</h3>
              <p className="stat-value">0</p>
            </div>
            <div className="stat-card">
              <h3>Rating</h3>
              <p className="stat-value">0 ⭐</p>
            </div>
            <div className="stat-card">
              <h3>Available Tasks</h3>
              <p className="stat-value">0</p>
            </div>
          </div>
        );

      case "available":
        return <h2>No available tasks yet</h2>;

      case "ongoing":
        return <h2>No ongoing tasks</h2>;

      case "completed":
        return <h2>No completed tasks</h2>;

      case "earnings":
        return <h2>Earnings feature coming soon</h2>;

      case "messages":
        return <h2>Chat feature coming soon</h2>;

      case "profile":
        return (
          <div>
            <h2>Your Profile</h2>
            <p>Name: Worker</p>
            <p>Role: Worker</p>
          </div>
        );

      case "settings":
        return <h2>Settings coming soon</h2>;

      default:
        return null;
    }
  };

  const formatName = (name = "") => {
  return name
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


  return (
    <div className="worker-dashboard">
      
            {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <img
            src={logo}
            alt="TaskNest Logo"
            className="dashboard-logo"
          />
      
          <div className="welcome-box">
            <div className="welcome-title">
              Welcome, <span className="welcome-name">{formatName(userData.name)}</span>

              <span className="wave">👋</span>
            </div>
      
            <div className="welcome-sub">
              Find tasks that match your skills
            </div>
          </div>
        </div>
      
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
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

export default WorkerDashboard;
