import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WorkerMyTasks.css";


const WorkerMyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("ongoing");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/tasks/worker-tasks",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) setTasks(data);

    } catch (err) {
      console.error("Failed to fetch worker tasks");
    }
  };

  const ongoingTasks = tasks.filter(task =>
    ["assigned", "in_progress"].includes(task.status)
  );

  const historyTasks = tasks.filter(task =>
    ["completed", "cancelled"].includes(task.status)
  );

  const displayTasks =
    activeTab === "ongoing" ? ongoingTasks : historyTasks;

  return (
    <div className="workermy-page">
      <h2 className="workermy-title">My Tasks</h2>

      {/* TABS */}
      <div className="workermy-tabs">
        <button
          className={activeTab === "ongoing" ? "active" : ""}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing Tasks
        </button>

        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          Task History
        </button>
      </div>

      {/* TASK GRID */}
      {displayTasks.length === 0 ? (
        <p className="empty-text">No tasks found</p>
      ) : (
        <div className="workermy-grid">
          {displayTasks.map(task => (
            <div key={task._id} className="workermy-card">

              <div className="provider-section">
                <img
                  src={
                    task.provider?.profileImage
                      ? `http://localhost:5000/${task.provider.profileImage}`
                      : "/default-user.png"
                  }
                  alt="provider"
                />
                <span>{task.provider?.name}</span>
              </div>

              <h3>{task.title}</h3>
              <p>{task.description}</p>

              <div className="task-details">
                <p><strong>Skill:</strong> {task.requiredSkill}</p>
                <p><strong>Budget:</strong> ₹{task.budget}</p>
                <p><strong>Date:</strong> {task.taskDate?.slice(0,10)}</p>
                <p><strong>Status:</strong> {task.status}</p>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default WorkerMyTasks;
