import { useEffect, useState } from "react";
import "./WorkerProfile.css";

const WorkerProfile = ({ workerId, goBack, taskId }) => {

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const sendConnection = async () => {
  if (!taskId) {
    alert("Task not selected");
    return;
  }

  try {
    setConnecting(true);

    const res = await fetch(
      "http://localhost:5000/api/connections/request",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          taskId,
          workerId,
        }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      setRequestSent(true);
      alert("Connection request sent!");
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error(err);
  } finally {
    setConnecting(false);
  }
};

   const formatName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
useEffect(() => {
  if (taskId && workerId) {
    checkExistingRequest();
  }
}, [taskId, workerId]);

const checkExistingRequest = async () => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/connections/check?taskId=${taskId}&workerId=${workerId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (res.ok && data.exists) {
      setRequestSent(true);
    }
  } catch (err) {
    console.error(err);
  }
};



  useEffect(() => {
    fetchWorker();
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/workers/${workerId}`
      );
      const data = await res.json();
      setWorker(data);
    } catch (err) {
      console.error("Failed to fetch worker");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading worker profile...</p>;
  if (!worker) return <p>Worker not found.</p>;

 return (
  
  
    <div className="worker-profile-container">
<button className="wp-back-btn" onClick={goBack}>
  ← Back to Workers
</button>
      {/* HEADER */}
      <div className="profile-header">
        <img
          className="profile-image"
          src={
            worker.profileImage
              ? `http://localhost:5000/${worker.profileImage}`
              : "/default-user.png"
          }
          alt="worker"
        />

        <div className="profile-info">
          <h2>{formatName(worker.name)}</h2>


          {/* Overall Rating */}
          <div className="rating-badge">
            ⭐ {worker.overallRating?.toFixed(1) || "0.0"} Overall Rating
          </div>

{taskId && (
  <button
    className="wp-connect-btn"
    disabled={connecting || requestSent}
    onClick={sendConnection}
  >
    {requestSent
      ? "Request Sent"
      : connecting
      ? "Sending..."
      : "Connect"}
  </button>
)}


          {/* Skill Ratings */}
          {worker.skillRatings &&
            worker.skillRatings.length > 0 && (
              <div className="skill-rating-list">
                {worker.skillRatings.map((r, index) => (
                  <div
                    key={index}
                    className="skill-rating-item"
                  >
                    {r.skill}: ⭐ {r.rating}
                  </div>
                ))}
              </div>
            )}

          <p><strong>Skills:</strong></p>

          <div className="skill-list">
            {worker.skills?.map((skill, index) => (
              <span key={index} className="skill-chip">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PREVIOUS WORKS */}
      <div className="profile-section">
        <h3>Previous Works</h3>

        <div className="work-gallery">
          {worker.previousWorks &&
          worker.previousWorks.length > 0 ? (
            worker.previousWorks.map((img, index) => (
              <img
                key={index}
                src={`http://localhost:5000/${img}`}
                alt="work"
              />
            ))
          ) : (
            <p>No previous works uploaded.</p>
          )}
        </div>
      </div>

      {/* REVIEWS */}
      <div className="profile-section">
        <h3>Reviews</h3>

        {worker.reviews &&
        worker.reviews.length > 0 ? (
          worker.reviews.map((review, index) => (
            <div key={index} className="review-card">
              <h4>{review.user}</h4>
              <div className="review-rating">
                ⭐ {review.rating}
              </div>
              <div className="review-text">
                {review.comment}
              </div>
            </div>
          ))
        ) : (
          <p>No reviews yet.</p>
        )}
      </div>

    </div>
  
);

};

export default WorkerProfile;
