import { useEffect, useState } from "react";
import "./Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        setNotifications(data);

        await fetch(
          "http://localhost:5000/api/notifications/read",
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  return (
    <div className="notif-page">
      <h2 className="notif-title">Notifications</h2>

      {notifications.length === 0 ? (
        <p className="notif-empty">No notifications</p>
      ) : (
        notifications.map((n) => (
          <div key={n._id} className="notif-card">
            <h4>{n.title}</h4>
            <p>{n.message}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;
