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

  const fetchNotifications = async () => {

    try {

      const res = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (res.ok) {
        setNotifications(data);
      }

    } catch (err) {
      console.error("Failed to fetch notifications");
    }

  };

  const markRead = async () => {

    try {

      await fetch(
        "http://localhost:5000/api/notifications/read",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

    } catch (err) {
      console.error("Failed to mark notifications as read");
    }

  };

  return (

    <div className="notifications-page">

      <h2 className="page-title">Notifications</h2>

      {notifications.length === 0 ? (

        <p>No notifications</p>

      ) : (

        <div className="notifications-list">

          {notifications.map(notification => (

            <div
              key={notification._id}
              className="notification-card"
              onClick={() => {

                if (notification.taskId) {

                  navigate(
                    `/worker/dashboard?tab=mytasks&task=${notification.taskId}`
                  );

                }

              }}
            >

              <h4>{notification.title}</h4>

              <p>{notification.message}</p>

              <small>
                {new Date(notification.createdAt).toLocaleString()}
              </small>

            </div>

          ))}

        </div>

      )}

    </div>

  );

};

export default WorkerNotifications;