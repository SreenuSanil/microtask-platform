import { useEffect, useState } from "react";
import "./WorkerInvitations.css";

const WorkerInvitations = ({ setInvitationCount }) => {
  const [invitations, setInvitations] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

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
        setInvitations(data);

        const pending = data.filter(
          (inv) => inv.status === "pending"
        ).length;

        setInvitationCount(pending);
      }
    } catch (err) {
      console.error("Failed to fetch invitations");
    }
  };

  const handleAccept = async (id) => {
    await fetch(
      `http://localhost:5000/api/connections/${id}/accept`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    fetchInvitations();
  };

  const handleReject = async (id) => {
    await fetch(
      `http://localhost:5000/api/connections/${id}/reject`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    fetchInvitations();
  };

  return (
    <div className="worker-inv-page">
      <h2>Task Invitations</h2>

      {invitations.length === 0 ? (
        <p>No invitations</p>
      ) : (
        invitations.map((inv) => {
          const task = inv.task;
          const provider = inv.provider;

          return (
            <div key={inv._id} className="inv-card">

              {/* Provider Section */}
              <div className="inv-provider">
                <img
                  src={
                    provider?.profileImage
                      ? `http://localhost:5000/${provider.profileImage}`
                      : "/default-user.png"
                  }
                  alt="provider"
                />
                <div>
                  <h3>{provider?.name}</h3>
                  <span className={`status-tag ${inv.status}`}>
                    {inv.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Task Details */}
              <h2 className="task-title">{task?.title}</h2>
              <p className="task-desc">{task?.description}</p>

              <div className="task-details">
                <p><strong>Skill:</strong> {task?.requiredSkill}</p>
                <p><strong>Budget:</strong> ₹{task?.budget}</p>
                <p><strong>Date:</strong> {task?.taskDate?.slice(0, 10)}</p>
                <p><strong>Urgency:</strong> {task?.urgency}</p>

                <p><strong>Address:</strong></p>
                <p>
                  {task?.siteAddress?.houseName},{" "}
                  {task?.siteAddress?.area}
                </p>

                {task?.siteAddress?.landmark && (
                  <p><strong>Landmark:</strong> {task.siteAddress.landmark}</p>
                )}

                {task?.siteAddress?.instructions && (
                  <p><strong>Instructions:</strong> {task.siteAddress.instructions}</p>
                )}
              </div>

              {/* Images */}
              {task?.images?.length > 0 && (
                <div className="task-images">
                  {task.images.map((img, i) => (
                    <img
                      key={i}
                      src={`http://localhost:5000/${img}`}
                      alt="task"
                      onClick={() =>
                        setPreviewImage(
                          `http://localhost:5000/${img}`
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {/* Buttons */}
              {inv.status === "pending" && (
                <div className="inv-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAccept(inv._id)}
                  >
                    Accept
                  </button>

                  <button
                    className="reject-btn"
                    onClick={() => handleReject(inv._id)}
                  >
                    Reject
                  </button>
                </div>
              )}

              {inv.status === "accepted" && (
                <div className="accepted-msg">
                  You can message the provider now.
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="image-modal"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="preview" />
        </div>
      )}
    </div>
  );
};

export default WorkerInvitations;