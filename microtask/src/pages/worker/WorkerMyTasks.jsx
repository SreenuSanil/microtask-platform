import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WorkerMyTasks.css";


const WorkerMyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("waiting");
  const [completionImages, setCompletionImages] = useState({});
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

const cancelTask = async (taskId) => {

  if (!window.confirm("Cancel this task?")) return;

  try {

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
      fetchTasks();
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.log(err);
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

const markTaskComplete = async (taskId) => {
  try {

    const formData = new FormData();
     const image = completionImages[taskId];
    if (image) {
      formData.append("completionImage", image);
    }

    const res = await fetch(
      `http://localhost:5000/api/tasks/mark-complete/${taskId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Work submitted for provider verification");
      fetchTasks();
      
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error("Complete task error", err);
  }
};

const waitingTasks = tasks.filter(
  task => task.status === "assigned"
);

const ongoingTasks = tasks.filter(
  task => task.status === "in_progress"
);

const pendingVerificationTasks = tasks.filter(
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

if (activeTab === "waiting") displayTasks = waitingTasks;
if (activeTab === "ongoing") displayTasks = ongoingTasks;
if (activeTab === "verify") displayTasks = pendingVerificationTasks;
if (activeTab === "completed") displayTasks = completedTasks;
if (activeTab === "cancelled") displayTasks = cancelledTasks;
if (activeTab === "dispute") displayTasks = disputeTasks;  
return (
    <div className="workermy-page">
      <h2 className="workermy-title">My Tasks</h2>

     <div className="workermy-tabs">

<button
  className={activeTab === "waiting" ? "active" : ""}
  onClick={() => setActiveTab("waiting")}
>
  Waiting Payment ({waitingTasks.length})
</button>

<button
  className={activeTab === "ongoing" ? "active" : ""}
  onClick={() => setActiveTab("ongoing")}
>
  Ongoing Work ({ongoingTasks.length})
</button>

<button
  className={activeTab === "verify" ? "active" : ""}
  onClick={() => setActiveTab("verify")}
>
  Pending Approval ({pendingVerificationTasks.length})
</button>

<button
  className={activeTab === "completed" ? "active" : ""}
  onClick={() => setActiveTab("completed")}
>
  Completed ({completedTasks.length})
</button>

<button
  className={activeTab === "cancelled" ? "active" : ""}
  onClick={() => setActiveTab("cancelled")}
>
  Cancelled ({cancelledTasks.length})
</button>

<button
  className={activeTab === "dispute" ? "active" : ""}
  onClick={() => setActiveTab("dispute")}
>
  Disputes ({disputeTasks.length})
</button>

</div>

      {/* TASK GRID */}
      {displayTasks.length === 0 ? (
        <p className="empty-text">No tasks found</p>
      ) : (
        <div className="workermy-grid">
          {displayTasks.map(task => (
           <div key={task._id} className="workermy-card">

  {/* Provider Section */}
  <div className="provider-section">
    <span className={`task-status ${task.status}`}>
  {task.status.replace("_", " ")}
</span>
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

  {/* Task Basic Info */}
  <h3>{task.title}</h3>
  <p>{task.description}</p>

{task.status === "dispute" && (
  <div className="dispute-box">
    ⚠ Dispute raised. Waiting for admin resolution.
  </div>
)}

  {task.rejectionReason && (
  <div className="reject-box">
    <p style={{color:"red"}}>
      ⚠ Work Rejected
    </p>

    <p>
      <strong>Reason:</strong> {task.rejectionReason}
    </p>
  </div>
)}

{task.rejectionReason && task.status === "in_progress" && (
  <button
    className="dispute-btn"
    onClick={() => raiseDispute(task._id)}
  >
    Raise Dispute
  </button>
)}

  <div className="task-details">
    <p><strong>Skill:</strong> {task.requiredSkill}</p>
    <p className="task-budget">₹{task.budget}</p>
    <p><strong>Date:</strong> {task.taskDate?.slice(0,10)}</p>
    <p><strong>Urgency:</strong> {task.urgency}</p>

    {/* Address Section */}
    <p><strong>Address:</strong></p>
    <p>
      {task.siteAddress?.houseName},{" "}
      {task.siteAddress?.area}
    </p>

    {task.siteAddress?.landmark && (
      <p><strong>Landmark:</strong> {task.siteAddress.landmark}</p>
    )}

    {task.siteAddress?.instructions && (
      <p><strong>Instructions:</strong> {task.siteAddress.instructions}</p>
    )}
  </div>

  {/* Task Images */}
  {task.images?.length > 0 && (
    <div className="task-images">
      {task.images.map((img, i) => (
        <img
          key={i}
          src={`http://localhost:5000/${img}`}
          alt="task"
        />
      ))}
    </div>
  )}

  {task.status === "in_progress" && (
  <button
    className="cancel-btn"
    onClick={() => cancelTask(task._id)}
  >
    Cancel Task
  </button>
)}

{task.status === "in_progress" && (
  <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setCompletionImages(prev => ({
      ...prev,
      [task._id]: e.target.files[0]
    }))
  }
/>
)}

{/* WORK COMPLETED BUTTON */}
<div className="task-actions">

{task.status === "in_progress" && (
  
  <button
    className="complete-btn"
    onClick={() => markTaskComplete(task._id)}
  >
    Mark Work Completed
  </button>
)}

{task.status === "pending_verification" && (
  <div className="verification-msg">
    Waiting for provider approval
  </div>
)}

</div>
</div>

          ))}
        </div>
      )}

    </div>
  );
};

export default WorkerMyTasks;
