import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./TaskWorkers.css";
import logo from "../../assets/tasknest.png";

const TaskWorkers = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [workers, setWorkers] = useState([]);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedRadius, setSelectedRadius] = useState(20000);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadTask();
  }, []);

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

      if (reset) {
        setWorkers(data);
      } else {
        setWorkers((prev) => [...prev, ...data]);
      }

      setSkip(customSkip + customLimit);
      setHasMore(data.length === customLimit);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <p className="loading">Loading workers...</p>;

  const formatName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


return (
  <div className="tw-page">

    {/* NAVBAR */}
    <div className="tw-navbar">
      <div className="tw-navbar-left">
        <button
          className="tw-back-btn"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <img src={logo} alt="TaskNest" className="tw-logo" />
      </div>
    </div>

    <div className="tw-content">

      {/* HEADER */}
      <div className="tw-header">
        <h1>{task?.title}</h1>
        <span className="tw-skill">{task?.requiredSkill}</span>
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
          <div className="tw-grid">
            {workers.map((worker) => (
              <div
                key={worker._id}
                className="tw-card"
                onClick={() =>
                  navigate(`/provider/worker/${worker._id}?task=${taskId}`)

                }
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


                  <p className="tw-rating">
                    ⭐ {
                      worker.skillRatings?.find(
                        r =>
                          r.skill ===
                          task?.requiredSkill?.toLowerCase()
                      )?.rating ?? 0
                    }
                  </p>

                  <p className="tw-distance">
                    {worker.distance
                      ? `${(worker.distance / 1000).toFixed(1)} km away`
                      : ""}
                  </p>

                  {worker.isAvailable && (
                    <span className="tw-available">
                      Available
                    </span>
                  )}
                </div>
              </div>
            ))}
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
  </div>
);

};

export default TaskWorkers;
