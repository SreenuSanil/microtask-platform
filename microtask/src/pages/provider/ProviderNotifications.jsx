import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProviderNotifications.css";

const ProviderNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      fetchNotifications();
      markRead();
    }
  }, [token]);

  // ✅ FETCH NOTIFICATIONS
  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        "https://microtask-platform-backend-y3xo.onrender.com/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setNotifications(data);
      } else {
        console.error("Invalid response:", data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  // ✅ MARK AS READ
  const markRead = async () => {
    try {
      await fetch(
        "https://microtask-platform-backend-y3xo.onrender.com/api/notifications/read",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  return (
    <div className="notifications-page">
      <h2 className="page-title">Notifications</h2>

      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-card ${
  notification?.type === "connection_rejected" ? "disabled" : ""
}`}
            >
              {/* ✅ PROFILE IMAGE */}
              <img
                src={
                  notification?.profileImage || "/default-avatar.png"
                }
                alt="user"
                className="notif-avatar"
              />

              {/* ✅ TEXT CONTENT */}
<div className="notification-content">
  <h4>{notification?.title || "Notification"}</h4>

  <p>{notification?.message || "No message"}</p>
{notification?.title === "Worker Ready for Payment" && (
  <p style={{ fontSize: "12px", color: "green" }}>
   Pay from Chat or My Tasks → Waiting Payment
  </p>
)}
  {notification?.title === "Invitation Accepted" && (
    <p style={{ fontSize: "12px", color: "gray" }}>
      Go to Messages to chat
    </p>
  )}

  <small>
    {notification?.createdAt
      ? new Date(notification.createdAt).toLocaleString()
      : ""}
  </small>
</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderNotifications;