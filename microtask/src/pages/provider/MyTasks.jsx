import { useState, useEffect } from "react";
import "./MyTasks.css";
import { useNavigate } from "react-router-dom";
import TaskWorkers from "./TaskWorkers";

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("open");
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [workerCounts, setWorkerCounts] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
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

const openTasks = tasks.filter(
  task => task.status === "open"
);

const waitingPaymentTasks = tasks.filter(
  task => task.status === "assigned"
);

const ongoingTasks = tasks.filter(
  task => task.status === "in_progress"
);
const verificationTasks = tasks.filter(
  task => task.status === "pending_verification"
);

const completedTasks = tasks.filter(
  task => task.status === "completed"
);

const cancelledTasks = tasks.filter(
  task => task.status === "cancelled"
);

const disputeTasks = tasks.filter(
  task => task.status === "dispute"
);

let displayTasks = [];

if (activeTab === "open") displayTasks = openTasks;
if (activeTab === "waiting") displayTasks = waitingPaymentTasks;
if (activeTab === "ongoing") displayTasks = ongoingTasks;
if (activeTab === "cancelled") displayTasks = cancelledTasks;
if (activeTab === "verify") displayTasks = verificationTasks;
if (activeTab === "completed") displayTasks = completedTasks;
if (activeTab === "dispute") displayTasks = disputeTasks;
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


  if (selectedTaskId) {
  return (
    <TaskWorkers
      taskId={selectedTaskId}
      goBack={() => setSelectedTaskId(null)}
    />
  );
}

const cancelOngoingTask = async (taskId) => {

  if (!window.confirm("Cancel this task?")) return;

  const res = await fetch(
    `http://localhost:5000/api/tasks/cancel-ongoing/${taskId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  const data = await res.json();

  if (res.ok) {
    alert("Task cancelled");
    window.location.reload();
  } else {
    alert(data.message);
  }
};

const rejectTask = async (taskId) => {

  const reason = prompt("Enter rejection reason");

  if (!reason) return;

  try {

    const res = await fetch(
      `http://localhost:5000/api/tasks/reject/${taskId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ reason }),
      }
    );

    const data = await res.json();

    if (res.ok) {

      alert("Work rejected");

      setTasks(prev =>
        prev.map(t =>
          t._id === taskId
            ? {
                ...t,
                status: "in_progress",
                rejectionReason: reason,
                completionImage: null,
              }
            : t
        )
      );

    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error(err);
  }
};

const raiseDispute = async (taskId) => {

  const reason = prompt("Enter dispute reason");

  if (!reason) return;

  try {

    const res = await fetch(
      `http://localhost:5000/api/tasks/raise-dispute/${taskId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ reason }),
      }
    );

    const data = await res.json();

    if (res.ok) {

      alert("Dispute raised");

      setTasks(prev =>
        prev.map(t =>
          t._id === taskId
            ? { ...t, status: "dispute" }
            : t
        )
      );

    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error(err);
  }
};

const approveTask = async (taskId) => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/tasks/approve/${taskId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Work approved. Payment released.");
      setTasks(prev =>
        prev.map(t =>
          t._id === taskId ? { ...t, status: "completed" } : t
        )
      );
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error(err);
  }
};

return (
  <div className="mytasks-container">
      <h2 className="page-title">My Tasks</h2>

      {/* Tabs */}
<div className="task-tabs">

  <button
    className={activeTab === "open" ? "active" : ""}
    onClick={() => setActiveTab("open")}
  >
    Open ({openTasks.length})
  </button>

<button
  className={activeTab === "waiting" ? "active" : ""}
  onClick={() => setActiveTab("waiting")}
>
  Waiting Payment ({waitingPaymentTasks.length})
</button>

<button
  className={activeTab === "ongoing" ? "active" : ""}
  onClick={() => setActiveTab("ongoing")}
>
  Ongoing ({ongoingTasks.length})
</button>

<button
  className={activeTab === "cancelled" ? "active" : ""}
  onClick={() => setActiveTab("cancelled")}
>
  Cancelled ({cancelledTasks.length})
</button>

<button
  className={activeTab === "verify" ? "active" : ""}
  onClick={() => setActiveTab("verify")}
>
  Pending Verification ({verificationTasks.length})
</button>

  <button
    className={activeTab === "completed" ? "active" : ""}
    onClick={() => setActiveTab("completed")}
  >
    Completed ({completedTasks.length})
  </button>

  <button
  className={activeTab === "dispute" ? "active" : ""}
  onClick={() => setActiveTab("dispute")}
>
  Disputes ({disputeTasks.length})
</button>

</div>

      {/* Task List */}
      {displayTasks.length === 0 ? (
        <p className="empty-text">No tasks found</p>
      ) : (
        <div className="task-grid">
          {displayTasks.map(task => (
            <div key={task._id} className="task-card">

{/* Worker Section */}
{task.assignedWorker && task.status !== "open" && (
  <div className="worker-section">

    <img
      src={
        task.assignedWorker?.profileImage
          ? `http://localhost:5000/${task.assignedWorker.profileImage}`
          : "/default-user.png"
      }
      alt="worker"
      className="worker-img"
    />

    <div className="worker-info">
      <span className="worker-name">
        {task.assignedWorker.name}
      </span>
      <span className="worker-label">
        Assigned Worker
      </span>
    </div>

  </div>
)}
                
              

              <div className="task-top">
                <h3>{task.title}</h3>
                <span className={`status-badge ${task.status}`}>
                  {task.status.replace("_", " ").toUpperCase()}
                </span>

              </div>

              <p className="task-desc">{task.description}</p>

              {task.status === "dispute" && (
  <div className="dispute-box">
    ⚠ This task is under dispute. Admin will review it.
  </div>
)}

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

{task.status === "in_progress" && (
  <button
    className="cancel-btn"
    onClick={() => cancelOngoingTask(task._id)}
  >
    Cancel Task
  </button>
)}


{/* Worker Completion Proof */}
{task.completionImage && (
  <div className="completion-proof">
    <p><strong>Worker Completion Proof:</strong></p>
    <img
      src={`http://localhost:5000/${task.completionImage}`}
      alt="completion proof"
      className="completion-img"
    />
  </div>
)}


             
<div className="task-actions">

  {/* OPEN TASK */}
  {task.status === "open" && (
    
    <>

      <button
        className="find-btn"
       onClick={() => setSelectedTaskId(task._id)}
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

{/* PENDING VERIFICATION */}
{task.status === "pending_verification" && (
 
  <>
    <button
      className="accept-btn"
      onClick={() => approveTask(task._id)}
    >
      Accept Work
    </button>

    <button className="reject-btn"
    onClick={() => rejectTask(task._id)}
    >
      Reject Work
    </button>

    <button className="dispute-btn"
    onClick={() => raiseDispute(task._id)}
    >
      Raise Dispute
    </button>
  </>
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
