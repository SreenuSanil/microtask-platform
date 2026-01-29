import { useState, useEffect } from "react";
import "./AdminDashboard.css";
import logo from "../assets/tasknest.png";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [userData, setUserData] = useState({
    name: "Loading..."
  });

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
    { id: "users", label: "User Management", icon: "👥" },
    { id: "tasks", label: "Task Management", icon: "📋" },
    { id: "reports", label: "Reports & Disputes", icon: "🚨" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "chat", label: "Chat Moderation", icon: "💬" },
    { id: "ratings", label: "Ratings & Reviews", icon: "⭐" },
    { id: "settings", label: "System Settings", icon: "⚙️" },
    { id: "profile", label: "Admin Profile", icon: "🛡️" }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="dashboard-grid">
            <div className="stat-card"><h3>Total Users</h3><p className="stat-value">0</p></div>
            <div className="stat-card"><h3>Total Workers</h3><p className="stat-value">0</p></div>
            <div className="stat-card"><h3>Total Providers</h3><p className="stat-value">0</p></div>
            <div className="stat-card"><h3>Total Tasks</h3><p className="stat-value">0</p></div>
            <div className="stat-card"><h3>Platform Revenue</h3><p className="stat-value">₹0</p></div>
          </div>
        );

      case "users":
        return <h2>User management (view, block, delete)</h2>;

      case "tasks":
        return <h2>Task approval, monitoring & removal</h2>;

      case "reports":
        return <h2>Reported users & dispute resolution</h2>;

      case "payments":
        return <h2>Transactions & commission tracking</h2>;

      case "analytics":
        return <h2>Platform usage analytics</h2>;

      case "chat":
        return <h2>Chat moderation & restricted content</h2>;

      case "ratings":
        return <h2>Ratings & review management</h2>;

      case "settings":
        return <h2>Platform settings & controls</h2>;

      case "profile":
        return (
          <div>
            <h2>Admin Profile</h2>
            <p>Role: Admin</p>
            <p>Platform: TaskNest</p>
          </div>
        );

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
    <div className="admin-dashboard">

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
        Your workspace is ready
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
              className={`menu-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
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

export default AdminDashboard;
