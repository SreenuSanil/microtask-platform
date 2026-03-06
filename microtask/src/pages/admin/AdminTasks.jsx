import { useEffect, useState } from "react";
import "./AdminTasks.css";

const AdminTasks = () => {

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {

      const res = await fetch(
        "http://localhost:5000/api/admin/tasks",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (res.ok) {
        setTasks(data);
      }

    } catch (err) {
      console.log("Failed to fetch tasks");
    }
  };

  /* ===============================
     FILTER TASKS
  =============================== */

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

  /* ===============================
     ADMIN CANCEL TASK
  =============================== */

  const cancelTask = async (taskId) => {

    if (!window.confirm("Cancel this task?")) return;

    try {

      const res = await fetch(
        `http://localhost:5000/api/admin/tasks/cancel/${taskId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.ok) {

        alert("Task cancelled");

        setSelectedTask(null);

        fetchTasks();

      }

    } catch (err) {
      console.log(err);
    }
  };

  return (

    <div className="admin-tasks">

      <h2 className="page-title">Task Management</h2>

      {/* FILTERS */}

      <div className="task-filters">

        <button onClick={() => setStatusFilter("all")}>All</button>

        <button onClick={() => setStatusFilter("open")}>Open</button>

        <button onClick={() => setStatusFilter("in_progress")}>In Progress</button>

        <button onClick={() => setStatusFilter("pending_verification")}>
          Pending Verification
        </button>

        <button onClick={() => setStatusFilter("completed")}>Completed</button>

        <button onClick={() => setStatusFilter("cancelled")}>Cancelled</button>

        <button onClick={() => setStatusFilter("dispute")}>Dispute</button>

      </div>

      {/* TASK LIST */}

      {!selectedTask ? (

        <div className="task-grid">

          {filteredTasks.length === 0 ? (
            <p>No tasks found</p>
          ) : (

            filteredTasks.map(task => (

              <div
                key={task._id}
                className="task-card"
              >

                <h3>{task.title}</h3>

                <p><strong>Budget:</strong> ₹{task.budget}</p>

                <p><strong>Provider:</strong> {task.provider?.name}</p>

                <p><strong>Worker:</strong> {task.assignedWorker?.name || "Not assigned"}</p>

                <p><strong>Status:</strong> {task.status}</p>

                <button
                  className="view-btn"
                  onClick={() => setSelectedTask(task)}
                >
                  View Details
                </button>

              </div>

            ))

          )}

        </div>

      ) : (

        /* ===============================
           TASK DETAILS
        =============================== */

        <div className="task-details">

          <button
            className="back-btn"
            onClick={() => setSelectedTask(null)}
          >
            ← Back
          </button>

          <h3>{selectedTask.title}</h3>

          <p>{selectedTask.description}</p>

          <p><strong>Budget:</strong> ₹{selectedTask.budget}</p>

          <p><strong>Status:</strong> {selectedTask.status}</p>

          <p><strong>Skill:</strong> {selectedTask.requiredSkill}</p>

          <p><strong>Task Date:</strong>
            {new Date(selectedTask.taskDate).toLocaleDateString()}
          </p>

          {/* PEOPLE */}

          <div className="people-section">

            <div className="person-box">

              <h4>Provider</h4>

              <img
                src={
                  selectedTask.provider?.profileImage
                    ? `http://localhost:5000/${selectedTask.provider.profileImage}`
                    : "/default-user.png"
                }
                alt="provider"
              />

              <p>{selectedTask.provider?.name}</p>

              <p>📞 {selectedTask.provider?.phone}</p>

            </div>

            {selectedTask.assignedWorker && (

              <div className="person-box">

                <h4>Worker</h4>

                <img
                  src={
                    selectedTask.assignedWorker?.profileImage
                      ? `http://localhost:5000/${selectedTask.assignedWorker.profileImage}`
                      : "/default-user.png"
                  }
                  alt="worker"
                />

                <p>{selectedTask.assignedWorker?.name}</p>

                <p>📞 {selectedTask.assignedWorker?.phone}</p>

              </div>

            )}

          </div>

          {/* TASK IMAGES */}

          {selectedTask.images?.length > 0 && (

            <div className="image-section">

              <h4>Task Images</h4>

              <div className="image-grid">

                {selectedTask.images.map((img, i) => (

                  <img
                    key={i}
                    src={`http://localhost:5000/${img}`}
                    alt="task"
                  />

                ))}

              </div>

            </div>

          )}

          {/* COMPLETION PROOF */}

          {selectedTask.completionImage && (

            <div className="image-section">

              <h4>Completion Proof</h4>

              <img
                className="completion-img"
                src={`http://localhost:5000/${selectedTask.completionImage}`}
                alt="completion"
              />

            </div>

          )}

          {/* PAYMENT STATUS */}

          <div className="payment-section">

            <p>
              <strong>Escrow Status:</strong> {selectedTask.escrowStatus}
            </p>

            <p>
              <strong>Payment Status:</strong> {selectedTask.paymentStatus}
            </p>

          </div>

          {/* TIMELINE */}

          <div className="timeline">

            <h4>Task Timeline</h4>

            <p>Created: {new Date(selectedTask.createdAt).toLocaleString()}</p>

            {selectedTask.completedAt && (
              <p>Completed: {new Date(selectedTask.completedAt).toLocaleString()}</p>
            )}

            {selectedTask.verifiedAt && (
              <p>Verified: {new Date(selectedTask.verifiedAt).toLocaleString()}</p>
            )}

          </div>

          {/* ADMIN ACTION */}

          {selectedTask.status !== "completed" &&
           selectedTask.status !== "cancelled" && (

            <button
              className="cancel-btn"
              onClick={() => cancelTask(selectedTask._id)}
            >
              Cancel Task
            </button>

          )}

        </div>

      )}

    </div>
  );

};

export default AdminTasks;