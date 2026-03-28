import { useEffect, useState } from "react";
import "./TaskWorkers.css";
import WorkerProfile from "../WorkerProfile";

const TaskWorkers = ({ taskId, goBack }) => {

  const [workers, setWorkers] = useState([]);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(20000);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);

 useEffect(() => {
  loadTask();
}, [taskId]);

  useEffect(() => {
    if (task) {
      loadWorkers(0, 5, true);
    }
  }, [selectedRadius]);

  const loadTask = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

    if (!res.ok || !data || data.message) {
      console.error("❌ Invalid task:", data);
      setTask(null);
      setLoading(false);
      return;
    }

      setTask(data);
      loadWorkers(0, 5, true, data);

    } catch (err) {
      console.error(err);
    }
  };

  const loadWorkers = async (
    customSkip,
    customLimit,
    reset = false,
    taskData = task
  ) => {
    try {
  if (!taskData || !taskData.location || !taskData.location.coordinates) {
  console.error("❌ Invalid location data:", taskData);
  setWorkers([]);
  setLoading(false);
  return;
}

const [lng, lat] = taskData.location.coordinates;

      const res = await fetch(
        "http://localhost:5000/api/workers/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            skill: taskData.requiredSkill,
            lat,
            lng,
            urgency: taskData.urgency,
            radius: selectedRadius,
            limit: customLimit,
            skip: customSkip,
          }),
        }
      );

const data = await res.json();

console.log("API RESPONSE:", data); // DEBUG

if (Array.isArray(data)) {
  if (reset) {
    setWorkers(data);
  } else {
    setWorkers((prev) => [...prev, ...data]);
  }

  setSkip(customSkip + customLimit);
  setHasMore(data.length === customLimit);
} else {
  console.error("❌ Invalid API response:", data);
  setWorkers([]);
}

setLoading(false);

      setSkip(customSkip + customLimit);
      setHasMore(data.length === customLimit);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading)
  return (
    <div className="tw-skeleton-grid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="tw-skeleton-card"></div>
      ))}
    </div>
  );

  const formatName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// get rating for specific skill
const getSkillRating = (worker) => {
  const skill = task?.requiredSkill?.toLowerCase();

  const ratingData = worker.skillRatings?.find(
    r => r.skill === skill
  );

  if (!ratingData || ratingData.ratingCount === 0) {
    return null;
  }

  return ratingData.ratingAverage;
};

// get review count for specific skill
const getSkillReviewCount = (worker) => {
  const skill = task?.requiredSkill?.toLowerCase();

  return worker.reviews?.filter(
    r => r.skill === skill
  ).length || 0;
};

// get completed jobs for specific skill
const getSkillJobs = (worker) => {
  const skill = task?.requiredSkill?.toLowerCase();

  const jobData = worker.skillCompletedTasks?.find(
    s => s.skill === skill
  );

  return jobData?.count || 0;
};


const refreshWorkers = () => {
  if (!task) return;
  loadWorkers(0, 5, true, task);
};

if (selectedWorkerId) {
  return (
    <div className="tw-profile-transition">
      <WorkerProfile
       workerId={selectedWorkerId}
       taskId={taskId}
       goBack={() => setSelectedWorkerId(null)}
       onReviewSubmitted={refreshWorkers}
      />
    </div>
  );
}

if (!task) {
  return (
    <div style={{ padding: "20px" }}>
      <p>⚠ Task not found or failed to load</p>
      <button onClick={goBack}>← Go Back</button>
    </div>
  );
}

return (
  <div className="tw-content">
<div className="tw-header">
  <button className="tw-back-btn" onClick={goBack}>
    ← Back
  </button>

  <h2 className="tw-heading">
    Available Workers Near You
  </h2>
</div>

    {/* RADIUS */}
    <div className="tw-radius">
      <label>Search Radius (km)</label>
      <input
        type="number"
        min="1"
        value={selectedRadius / 1000}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "") {
            setSelectedRadius("");
            return;
          }
          const km = Number(value);
          if (!isNaN(km) && km >= 1) {
            setSelectedRadius(km * 1000);
          }
        }}
      />
    </div>

    {/* WORKERS */}
    {workers.length === 0 ? (
      <div className="tw-empty">
        <h3>No workers found</h3>
        <p>Try increasing the radius</p>
      </div>
    ) : (
      <>

      <div className="tw-count">
  <span>{workers.length}</span> Workers Found
</div>

<div className="tw-grid">

{Array.isArray(workers) && workers.map((worker,index) => {

  const rating = getSkillRating(worker);
  const jobs = getSkillJobs(worker);
  const reviews = getSkillReviewCount(worker);

 const distanceKm = worker.distance
    ? (worker.distance / 1000).toFixed(1)
    : null;

  return (

    <div
      key={worker._id}
      className="tw-card"
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => setSelectedWorkerId(worker._id)}
    >

      <img
        src={
          worker.profileImage
            ? `http://localhost:5000/${worker.profileImage}`
            : "/default-user.png"
        }
        alt="worker"
      />

      <div className="tw-info">

        <h4>{formatName(worker.name)}</h4>

    <div className="tw-rating-block">
      <p className="tw-distance">
  {distanceKm ? `${distanceKm} km away` : "Distance unavailable"}
</p>

  {rating ? (
    <>
      <div className="tw-stars">
        {"★".repeat(Math.round(rating))}
        {"☆".repeat(5 - Math.round(rating))}
        <span className="tw-rating-value">
          {rating.toFixed(1)}
        </span>
      </div>

      <p className="tw-review-count">
        {reviews} reviews
      </p>
    </>
  ) : (
    <p className="tw-new">New Worker</p>
  )}

</div>

<p className="tw-jobs">
  {jobs} jobs completed
</p>



      </div>

    </div>

  );

})}

</div>

        {hasMore && (
          <div className="tw-more">
            <button onClick={() => loadWorkers(skip, 20, false)}>
              Show More
            </button>
          </div>
        )}
      </>
    )}
  </div>
);

};

export default TaskWorkers;
