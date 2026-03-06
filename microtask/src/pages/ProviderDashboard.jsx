import { useState, useEffect } from "react";
import { useNavigate ,useLocation} from "react-router-dom";
import "./ProviderDashboard.css";
import logo from "../assets/tasknest.png";
import PostTask from "./provider/PostTask";
import MyTasks from "./provider/MyTasks";
import TaskWorkers from "./provider/TaskWorkers";
import ProviderProfile from "./provider/Profile";
import ProviderMessages from "./chat/ProviderMessages";
import ProviderInvites from "./provider/ProviderInvites";
import { io } from "socket.io-client";
import { useRef } from "react";
import ProviderTransactions from "./provider/ProviderTransactions";
import ProviderOverview from "./provider/ProviderOverview";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState("overview");
  const [workers, setWorkers] = useState([]);
  const [inviteCount, setInviteCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [userData, setUserData] = useState({
    name: "",
    organization: "",
    email: "",
  });


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

  useEffect(() => {
  const fetchInvites = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/connections/provider-invites",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
const inviteCount = data.filter(
  inv => inv.status === "accepted"
).length;

setInviteCount(inviteCount);
      }
    } catch (err) {
      console.error("Failed to fetch invites");
    }
  };

  fetchInvites();
}, []);

  useEffect(() => {
  if (userData.location?.coordinates) {
    fetchNearbyWorkers();
  }
}, [userData]);

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");

  if (tab) {
    setActiveSection(tab);
  }
}, [location.search]);

  const fetchNearbyWorkers = async () => {
  try {
    if (!userData.location?.coordinates) return;

    const latitude = userData.location.coordinates[1];
    const longitude = userData.location.coordinates[0];

    const res = await fetch(
      `http://localhost:5000/api/users/nearby-workers?latitude=${latitude}&longitude=${longitude}&radius=10`
    );

    const data = await res.json();
    setWorkers(data);
  } catch (err) {
    console.error("Failed to fetch workers");
  }
};

useEffect(() => {
  socketRef.current = io("http://localhost:5000");

  const storedUser = JSON.parse(localStorage.getItem("user"));

  // 🔥 JOIN PERSONAL ROOM (VERY IMPORTANT)
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
  /* =========================
     SIDEBAR MENU (PROVIDER ONLY)
  ========================= */
const menuItems = [
  { id: "overview", label: "Dashboard", icon: "📊" },
  { id: "post-task", label: "Post Task", icon: "➕" },
  { id: "my-tasks", label: "My Tasks", icon: "📋" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "payments", label: "Transactions", icon: "💳" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "profile", label: "Profile", icon: "👤" },
];

  /* =========================
     CONTENT RENDERER
  ========================= */
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <ProviderOverview />;

    case "post-task":
      return <PostTask goToMyTasks={() => setActiveSection("my-tasks")} />;


      case "my-tasks":
        return <MyTasks />;

         
        case "messages":
  return <ProviderMessages />;




          

case "workers":
  return (
    <div>
      <h2>Nearby Workers</h2>

      {workers.length === 0 ? (
        <p>No workers found nearby.</p>
      ) : (
        workers.map(worker => (
          <div key={worker._id} className="worker-card">
            <h4>{worker.name}</h4>
            <p><b>Skills:</b> {worker.skills}</p>
            <p><b>Address:</b> {worker.address}</p>
          </div>
        ))
      )}
    </div>
  );


      case "payments":
        return <ProviderTransactions />;
          
       

      case "notifications":
        return (
          <div>
            <h2>Notifications</h2>
            <p>No notifications yet.</p>
          </div>
        );
 
case "invitations":
  return <ProviderInvites />;

      case "profile":
        return <ProviderProfile />;


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


  {/* 🔔 Notifications */}
  <div
    className="header-icon"
    onClick={() => setActiveSection("notifications")}
  >
    🔔
  </div>

  {/* 💬 Messages */}
<div className="header-right">

  


  <div
    className="header-icon"
   onClick={() => {
  setInviteCount(0);
  setActiveSection("invitations");
}}
  >
    📩
    {inviteCount > 0 && (
      <span className="icon-badge">
        {inviteCount}
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
              <span className="menu-label"><div className="menu-item-content">
  <span>{item.label}</span>

  {item.id === "messages" && unreadCount > 0 && (
    <span className="notification-badge">
      {unreadCount}
    </span>
  )}
</div></span>
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
