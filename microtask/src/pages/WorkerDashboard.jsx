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
import { useLocation } from "react-router-dom";
import WorkerNotifications from "./worker/WorkerNotifications";
import WorkerWallet from "./worker/WorkerWallet";
import WorkerRatings from "./worker/WorkerRatings";
import WorkerOverview from "./worker/WorkerOverview";

const AVAILABILITY_LIMIT = 48 * 60 * 60 * 1000; // 48 hours

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("overview");
  const [invitationCount, setInvitationCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
const [selectedConnectionId, setSelectedConnectionId] = useState(null);
const [userData, setUserData] = useState({
  name: "Worker",
  rating: 0,
  totalEarnings: 0,
  completedTasks: 0,
  walletBalance: 0,
  ongoingTasks: 0
});

const [taskStats, setTaskStats] = useState({
  waitingPayment: 0,
  ongoing: 0,
  pendingApproval: 0,
  completed: 0
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

setUserData({
  name: data.name || "Worker",
  rating: data.ratingAverage || 0,
  totalEarnings: data.totalEarnings || 0,
  completedTasks: data.completedTasks || 0,
  walletBalance: data.walletBalance || 0,
  ongoingTasks: data.ongoingTasks || 0
});

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
  fetchTaskStats();

}, []);

useEffect(() => {
  const params = new URLSearchParams(location.search);

  const tab = params.get("tab");
  const connectionId = params.get("connectionId");

  if (tab) {
    setActiveSection(tab);
  }

  if (connectionId) {
    setSelectedConnectionId(connectionId);
  }

}, [location.search]);

const [availability, setAvailability] = useState({
  active: false,
  time: null,
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
  const fetchAvailability = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setAvailability({
          active: data.isAvailable,
          time: data.availableUntil,
        });
      }
    } catch (err) {
      console.error("Failed to fetch availability");
    }
  };

  fetchAvailability();
}, []);

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


const toggleAvailability = async () => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/users/toggle-availability",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (res.ok) {
      setAvailability({
        active: data.isAvailable,
        time: data.availableUntil,
      });
    }

  } catch (err) {
    console.error("Failed to toggle availability");
  }
};

const fetchTaskStats = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/tasks/worker-tasks", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    const tasks = await res.json();

    if (res.ok) {

      const completed = tasks.filter(
        t => t.status === "completed"
      ).length;

      const ongoing = tasks.filter(
        t => t.status === "accepted"
      ).length;

      const pendingApproval = tasks.filter(
        t => t.status === "pending_approval"
      ).length;

      const waitingPayment = tasks.filter(
        t => t.status === "waiting_payment"
      ).length;

      setTaskStats({
        completed,
        ongoing,
        pendingApproval,
        waitingPayment
      });

    }

  } catch (err) {
    console.error("Failed to fetch tasks");
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
    <WorkerOverview
      userData={userData}
      availability={availability}
      toggleAvailability={toggleAvailability}
      taskStats={taskStats}
    />
  );

    case "mytasks":
      return <WorkerMyTasks />;

   case "earnings":
  return <WorkerWallet />;
  
      case "invitations":
  return <WorkerInvitations setInvitationCount={setInvitationCount} />;

case "messages":
  return <WorkerMessages selectedConnectionId={selectedConnectionId} />;

case "notifications":
  return <WorkerNotifications />;

case "ratings":
  return <WorkerRatings />;

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
  onClick={() => setActiveSection("notifications")}
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
