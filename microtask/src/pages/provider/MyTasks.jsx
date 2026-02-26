import { useState, useEffect } from "react";
import "./MyTasks.css";
import { useNavigate } from "react-router-dom";

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [workerCounts, setWorkerCounts] = useState({});

  /* =============================
     FETCH PROVIDER TASKS
  ============================== */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/tasks/my-tasks",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await res.json();
        if (res.ok) setTasks(data);
      } catch (err) {
        console.log("Failed to fetch tasks");
      }
    };

    fetchTasks();
  }, []);


  /* =============================
     FILTER TASKS
  ============================== */
  const activeTasks = tasks.filter(task =>
    ["open", "assigned", "in_progress"].includes(task.status)
  );

  const historyTasks = tasks.filter(task =>
    ["completed", "cancelled"].includes(task.status)
  );

  const displayTasks =
    activeTab === "active" ? activeTasks : historyTasks;

  /* =============================
     CANCEL TASK
  ============================== */
const cancelTask = async (taskId) => {
  if (!window.confirm("Cancel this task?")) return;

  const res = await fetch(
    `http://localhost:5000/api/tasks/${taskId}/cancel`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (res.ok) {
    setTasks(prev =>
      prev.map(t =>
        t._id === taskId ? { ...t, status: "cancelled" } : t
      )
    );
  }
};

const openDeleteModal = (taskId) => {
  setTaskToDelete(taskId);
  setShowModal(true);
};

const confirmDelete = async () => {
  
  if (!taskToDelete) return;

  const res = await fetch(
    `http://localhost:5000/api/tasks/${taskToDelete}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (res.ok) {
    setTasks(prev => prev.filter(t => t._id !== taskToDelete));
  }

  setShowModal(false);
  setTaskToDelete(null);
};



  /* =============================
     SEARCH WORKERS
  ============================== */
  const searchWorkers = async (task, skip = 0) => {
    try {
      // 🔥 Clear previous workers if switching task
      if (selectedTask?._id !== task._id) {
        setWorkers([]);
      }

      setSelectedTask(task);
      setLoadingWorkers(true);
      setShowWorkers(true);

      const [lng, lat] = task.location.coordinates;

      const res = await fetch(
        "http://localhost:5000/api/workers/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            skill: task.requiredSkill,
            lat,
            lng,
            urgency: task.urgency,
            limit: 5,
            skip,
          }),
        }
      );

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Search error:", data);
        setWorkers([]);
        setLoadingWorkers(false);
        return;
      }

      if (skip === 0) {
        setWorkers(data);
      } else {
        setWorkers(prev => [...prev, ...data]);
      }

      setLoadingWorkers(false);

    } catch (err) {
      console.error("Error fetching workers:", err);
      setLoadingWorkers(false);
    }
  };

  return (
    <div className="mytasks-container">
      <h2 className="page-title">My Tasks</h2>

      {/* Tabs */}
      <div className="task-tabs">
        <button
          className={activeTab === "active" ? "active" : ""}
          onClick={() => setActiveTab("active")}
        >
          Active Tasks
        </button>

        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          Task History
        </button>
      </div>

      {/* Task List */}
      {displayTasks.length === 0 ? (
        <p className="empty-text">No tasks found</p>
      ) : (
        <div className="task-grid">
          {displayTasks.map(task => (
            <div key={task._id} className="task-card">

              {/* Provider Section */}
              <div className="provider-section">
                <img
                 src={
  task.provider?.profileImage
    ? `http://localhost:5000/${task.provider.profileImage}`
    : "/default-user.png"
}

                  alt="provider"
                  className="provider-img"
                />
                <div className="provider-info">
                  <span className="provider-name">
                    {task.provider?.name || "You"}
                  </span>
                </div>
              </div>

              <div className="task-top">
                <h3>{task.title}</h3>
                <span className={`status-badge ${task.status}`}>
                  {task.status.replace("_", " ").toUpperCase()}
                </span>

              </div>

              <p className="task-desc">{task.description}</p>

           

              <div className="task-details">
  <p><strong>Skill:</strong> {task.requiredSkill}</p>
  <p><strong>Budget:</strong> ₹{task.budget}</p>
  <p><strong>Date:</strong> {task.taskDate?.slice(0,10)}</p>
  <p><strong>Urgency:</strong> {task.urgency}</p>

  <p><strong>Address:</strong></p>
 <p>
  {task.siteAddress?.houseName}, {task.siteAddress?.area}
</p>

{task.siteAddress?.landmark && (
  <p><strong>Landmark:</strong> {task.siteAddress.landmark}</p>
)}

{task.siteAddress?.instructions && (
  <p><strong>Instructions:</strong> {task.siteAddress.instructions}</p>
)}


  {task.instructions && (
    <p><strong>Instructions:</strong> {task.instructions}</p>
  )}
</div>

{/* Task Images */}
{task.images?.length > 0 && (
  <div className="task-images">
    {task.images.map((img, index) => (
      <img
        key={index}
        src={`http://localhost:5000/${img}`}
        alt="task"
      />
    ))}
  </div>
)}


             
<div className="task-actions">

  {/* OPEN TASK */}
  {task.status === "open" && (
    
    <>

      <button
        className="find-btn"
        onClick={() => navigate(`/provider/task/${task._id}/workers`)}
      >
        Find Workers
      </button>

     <button
  className="edit-btn"
  onClick={() =>navigate(`/provider/post-task?edit=${task._id}`)
}
>
  Edit
</button>


     <button
  className="cancel-btn"
  onClick={() => openDeleteModal(task._id)}
>
  Delete
</button>

    </>
  )}

  {/* CANCELLED TASK */}
  {task.status === "cancelled" && (
    <button
      className="delete-btn"
      onClick={() => openDeleteModal(task._id)}

    >
      Delete Permanently
    </button>
  )}

</div>


</div>  
))}

</div>  
)}
{/* DELETE MODAL */}
{showModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3>Delete this task?</h3>
      <p>This action cannot be undone.</p>

      <div className="modal-actions">
        <button
          className="modal-cancel"
          onClick={() => {
            setShowModal(false);
            setTaskToDelete(null);
          }}
        >
          Cancel
        </button>

        <button
          className="modal-delete"
          onClick={confirmDelete}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

</div>   
);
};

export default MyTasks;
