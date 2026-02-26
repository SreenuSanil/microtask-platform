import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/tasknest.png";
import WorkerMyTasks from "./worker/WorkerMyTasks";
import "./WorkerDashboard.css";
import WorkerMessages from "./chat/WorkerMessages";
import WorkerInvitations from "./worker/WorkerInvitations";
import { io } from "socket.io-client";
import { useRef } from "react";
import WorkerProfile from "./worker/WorkerProfile";

const AVAILABILITY_LIMIT = 48 * 60 * 60 * 1000; // 48 hours

const WorkerDashboard = () => {
  const navigate = useNavigate();


  const [activeSection, setActiveSection] = useState("overview");
  const [invitationCount, setInvitationCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const [userData, setUserData] = useState({
    name: "Worker",
    rating: 4.4,
    totalEarnings: 4200,
    completedTasks: 18
  });

useEffect(() => {

  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        console.log("Auth error");
        return;
      }

      const data = await res.json();

      setUserData(prev => ({
        ...prev,
        name: data.name || "Worker"
      }));

    } catch (err) {
      console.error("Failed to fetch user");
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/connections/worker-invitations",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        const pendingCount = data.filter(
          inv => inv.status === "pending"
        ).length;

        setInvitationCount(pendingCount);
      }
    } catch {
      console.error("Failed to fetch invitations");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        const unread = data.filter(n => !n.read).length;
        setNotificationCount(unread);
      }
    } catch {
      console.error("Failed to fetch notifications");
    }
  };

  fetchUser();
  fetchInvitations();
  fetchNotifications();

}, []);



  const [availability, setAvailability] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("availability"));
    return saved || { active: false, time: null };
  });

  const [ongoingTasks] = useState([]);
  const [taskHistory] = useState([]);
  const [messages] = useState([]);
  const [notifications] = useState([]);
  const [reviews] = useState([]);

  const fetchUnread = async () => {
    const res = await fetch(
      "http://localhost:5000/api/messages/unread-count",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();
    setUnreadCount(data.totalUnread || 0);
  };

useEffect(() => {
  fetchUnread();
}, []);

useEffect(() => {
  socketRef.current = io("http://localhost:5000");

const storedUser = JSON.parse(localStorage.getItem("user"));
 socketRef.current.emit("join_user", storedUser.id || storedUser._id);

  socketRef.current.on("new_unread", () => {
    fetchUnread();
  });
  socketRef.current.on("refresh_unread", () => {
  fetchUnread();
});

  return () => {
    socketRef.current.disconnect();
  };
}, []);


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
          </div>
        </div>
      );

    case "mytasks":
      return <WorkerMyTasks />;

    case "earnings":
      return (
        <div>
          <h2>Earnings & Wallet</h2>
          <p>Wallet balance: ₹{userData.totalEarnings}</p>
        </div>
      );
      case "invitations":
  return <WorkerInvitations setInvitationCount={setInvitationCount} />;

    case "messages":
      return <WorkerMessages />;


    case "ratings":
      return(
<h1>blah blah blee blee</h1>)

    case "profile":
     return <WorkerProfile />;

    default:
      return null;
  }
};


  const menuItems = [
    { id: "overview", label: "Dashboard Overview", icon: "📊" },
    { id: "mytasks", label: "My Tasks", icon: "📋" },
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

<div className="header-right">

  <div
  className="header-icon"
  onClick={() => navigate("/worker/notifications")}
>
  🔔
  {notificationCount > 0 && (
    <span className="icon-badge">
      {notificationCount}
    </span>
  )}
</div>


  {/* Job Invitations Icon */}
  <div
    className="header-icon"
   onClick={() => setActiveSection("invitations")}
  >
    📩
    {invitationCount > 0 && (
      <span className="icon-badge">
        {invitationCount}
      </span>
    )}
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

</div>

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
              <span>
      <div className="menu-item-content">
  <span>{item.label}</span>

  {item.id === "messages" && unreadCount > 0 && (
    <span className="notification-badge">
      {unreadCount}
    </span>
  )}
</div>
    </span>
            </div>
          ))}
        </aside>

        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default WorkerDashboard;
