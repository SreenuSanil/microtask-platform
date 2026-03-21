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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");


  const [activeSection, setActiveSection] = useState("interviews");

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
