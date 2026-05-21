import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WorkerNotifications.css";

const WorkerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotifications();
    markRead();
  }, []);

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
        console.error("Invalid notifications response:", data);
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

  // ✅ CLICK HANDLER
  const handleClick = (notification) => {
    console.log("Clicked notification:", notification); // DEBUG

    if (notification?.connectionId) {
      navigate(
  `/worker-dashboard?tab=messages&connectionId=${notification.connectionId}`
);
    } else {
      console.warn("No connectionId found in notification");
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
              className="notification-card"
              onClick={() => handleClick(notification)}
            >
              {/* ✅ PROFILE IMAGE */}
              <img
                src={
                  notification?.profileImage
                    ? `https://microtask-platform-backend-y3xo.onrender.com/${notification.profileImage}`
                    : "/default-user.png"
                }
                alt="provider"
                className="notif-avatar"
              />

              {/* ✅ CONTENT */}
<div className="notification-content">
  <h4>{notification?.title || "Notification"}</h4>

  <p>{notification?.message || "No message"}</p>

  {/* ✅ ADD THIS */}
  {notification?.title === "Payment Completed" && (
    <p style={{ fontSize: "12px", color: "green" }}>
      Work has started. You can begin now.
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

export default WorkerNotifications;