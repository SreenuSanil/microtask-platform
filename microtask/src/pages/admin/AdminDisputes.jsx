import { useEffect, useState } from "react";
import "./AdminDisputes.css";

const AdminDisputes = () => {

  const [disputes, setDisputes] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [messages, setMessages] = useState([]);

  const [workerAmount, setWorkerAmount] = useState("");
  const [providerAmount, setProviderAmount] = useState("");

  const token = localStorage.getItem("token");

  /* ===============================
     FETCH DISPUTES
  =============================== */

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/disputes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setDisputes(data);
      }
    } catch (err) {
      console.log("Failed to fetch disputes");
    }
  };

  /* ===============================
     FETCH CHAT
  =============================== */

  const fetchChat = async (taskId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/disputes/${taskId}/chat`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessages(data);
      }
    } catch (err) {
      console.log("Failed to fetch chat");
    }
  };

  /* ===============================
     OPEN DISPUTE DETAILS
  =============================== */

  const openDispute = (task) => {
    setSelectedTask(task);
    fetchChat(task._id);
  };

  /* ===============================
     APPROVE WORKER
  =============================== */

  const approveWorker = async (taskId) => {
    if (!window.confirm("Approve worker and release payment?")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/disputes/approve/${taskId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        alert("Payment released to worker");
        setSelectedTask(null);
        fetchDisputes();
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ===============================
     REFUND PROVIDER
  =============================== */

  const refundProvider = async (taskId) => {
    if (!window.confirm("Refund provider?")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/disputes/refund/${taskId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        alert("Refund issued to provider");
        setSelectedTask(null);
        fetchDisputes();
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ===============================
     SPLIT PAYMENT
  =============================== */

  const splitPayment = async (task) => {
    if (!workerAmount || !providerAmount) {
      alert("Enter both amounts");
      return;
    }

    const total = Number(workerAmount) + Number(providerAmount);

    if (total !== task.budget) {
      alert("Amounts must equal task budget");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/disputes/split/${task._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workerAmount: Number(workerAmount),
            providerAmount: Number(providerAmount),
          }),
        }
      );

      if (res.ok) {
        alert("Payment split completed");

        setSelectedTask(null);
        setWorkerAmount("");
        setProviderAmount("");

        fetchDisputes();
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ===============================
     UI
  =============================== */

  return (
    <div className="admin-disputes">

      <h2 className="page-title">Disputed Tasks</h2>

      {selectedTask ? (

        <div className="dispute-details">

          <button
            className="back-btn"
            onClick={() => setSelectedTask(null)}
          >
            ← Back
          </button>

          <h3>{selectedTask.title}</h3>

          <p>
            <strong>Budget:</strong> ₹{selectedTask.budget}
          </p>

          {/* PEOPLE SECTION */}

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

          </div>

          {/* DISPUTE REASON */}

          <div className="reason-box">
            <p>
              <strong>Dispute Raised By:</strong>{" "}
              {selectedTask.dispute?.raisedBy}
            </p>

            <p>
              <strong>Reason:</strong>{" "}
              {selectedTask.dispute?.reason}
            </p>
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

          {/* COMPLETION IMAGE */}

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

          {/* CHAT HISTORY */}

          <div className="chat-section">

            <h4>Chat History</h4>

            {messages.length === 0 ? (
              <p>No messages</p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="chat-message">

                  <span className="chat-user">
                    {msg.sender?.name} ({msg.sender?.role})
                  </span>

                  <p>{msg.message}</p>

                </div>
              ))
            )}

          </div>

          {/* RESOLUTION BUTTONS */}

          <div className="resolution-box">

            <button
              className="approve-btn"
              onClick={() => approveWorker(selectedTask._id)}
            >
              Approve Worker
            </button>

            <button
              className="refund-btn"
              onClick={() => refundProvider(selectedTask._id)}
            >
              Refund Provider
            </button>

          </div>

          {/* SPLIT PAYMENT */}

          <div className="split-box">

            <h4>Split Payment</h4>

            <div className="split-inputs">

              <input
                type="number"
                placeholder="Worker Amount"
                value={workerAmount}
                onChange={(e) => setWorkerAmount(e.target.value)}
              />

              <input
                type="number"
                placeholder="Provider Refund"
                value={providerAmount}
                onChange={(e) => setProviderAmount(e.target.value)}
              />

            </div>

            <button
              className="split-btn"
              onClick={() => splitPayment(selectedTask)}
            >
              Confirm Split
            </button>

          </div>

        </div>

      ) : (

        <div className="dispute-grid">

          {disputes.length === 0 ? (
            <p>No disputes found</p>
          ) : (

            disputes.map((task) => (

              <div key={task._id} className="dispute-card">

                <h3>{task.title}</h3>

                <p><strong>Budget:</strong> ₹{task.budget}</p>

                <p><strong>Provider:</strong> {task.provider?.name}</p>

                <p><strong>Worker:</strong> {task.assignedWorker?.name}</p>

                <p><strong>Raised By:</strong> {task.dispute?.raisedBy}</p>

                <p className="reason">
                  {task.dispute?.reason}
                </p>

                <button
                  className="view-btn"
                  onClick={() => openDispute(task)}
                >
                  View Details
                </button>

              </div>

            ))

          )}

        </div>

      )}

    </div>
  );
};

export default AdminDisputes;