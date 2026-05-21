import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminNotifications.css";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // ✅ mark all as read
    fetch("http://localhost:5000/api/notifications/read", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, []);

  return (
    <div className="admin-notifications">
      <h2>Admin Notifications</h2>

      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        notifications.map((n) => {
          // ✅ detect high risk notifications
const isHighRisk =
  n.title?.toLowerCase().includes("high cancellation") ||
  n.title?.toLowerCase().includes("cancellation alert");
          return (
            <div
              key={n._id}
              className={`notif-card ${isHighRisk ? "alert-card" : ""}`}
            >
              <h4>{n.title}</h4>

              <p>
                {n.message}
                {isHighRisk && (
                  <span className="alert-icon"> 🚨</span>
                )}
              </p>

              {/* ✅ action button */}
              {isHighRisk && (
                <button
                  className="action-btn"
onClick={() => {
  if (n.userRole === "provider") {
    navigate("/admin-dashboard?tab=providers");
  } else {
    navigate("/admin-dashboard?tab=workers");
  }
}}
                >
                  View User
                </button>
              )}

              <small>
                {n.createdAt
                  ? new Date(n.createdAt).toLocaleString()
                  : ""}
              </small>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AdminNotifications;