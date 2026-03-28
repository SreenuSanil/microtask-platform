import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import logo from "../assets/tasknest.png";
import AdminDisputes from "./admin/AdminDisputes";
import AdminTasks from "./admin/AdminTasks";
import AdminRevenue from "./admin/AdminRevenue";
import AdminOverview from "./admin/AdminOverview";
import SystemSettings from "./admin/SystemSettings";
import AdminInterviews from "./admin/AdminInterviews";
import AdminWorkers from "./admin/AdminWorkers";
import AdminProviders from "./admin/AdminProviders";
import AdminNotifications from "./admin/AdminNotifications";
import { useLocation } from "react-router-dom";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notifCount, setNotifCount] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");


const location = useLocation();

useEffect(() => {
  const params = new URLSearchParams(location.search);

  const tab = params.get("tab");
  const userId = params.get("userId");

  if (tab) setActiveSection(tab);

  // store selected userId globally (simple way)
  if (userId) {
    localStorage.setItem("highlightUser", userId);
  }
}, [location.search]);
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

  const fetchNotifCount = async () => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/notifications/unread-count",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    if (res.ok) setNotifCount(data.count);
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  fetchNotifCount();
}, []);

  /* =========================
     RENDER
  ========================= */
const renderContent = () => {
  switch (activeSection) {

   case "overview":
      return <AdminOverview />;

  case "interviews":
  return <AdminInterviews />;

case "workers":
  return <AdminWorkers />;

  case "providers":
  return <AdminProviders />;

    case "complaints":
      return <AdminDisputes />;

    case "tasks":
      return <AdminTasks />;

  case "notifications":
  return <AdminNotifications />;

    case "revenue":
      return <AdminRevenue />;

    case "settings":
      return <SystemSettings />;

          default:
      return (
        <div className="coming-soon">
          <h2>Coming Soon</h2>
          <p>This section is under development</p>
        </div>
      );
}
};



  return (
    <div className="admin-dashboard">
<header className="admin-header">
  <div className="header-left">
    <img src={logo} alt="TaskNest" className="admin-logo" />
    <h1>Admin Dashboard</h1>
  </div>

  <div className="header-right">

    {/* 🔔 Notification Icon */}
    <div
      className="notif-icon"
      onClick={() => setActiveSection("notifications")}
    >
      🔔
{notifCount > 0 && (
  <span className="notif-badge">
    {notifCount}
  </span>
)}
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

  </div>
</header>

      <div className="admin-body">
<aside className="admin-sidebar">

  <div className="sidebar-menu">
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
  </div>

</aside>

        <main className="admin-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
